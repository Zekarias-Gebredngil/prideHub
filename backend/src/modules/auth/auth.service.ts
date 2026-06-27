import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OtpType, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UAParser } from 'ua-parser-js';
import { JwtUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { SmsService } from '../sms/sms.service';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto/auth.dto';

// ─── Security Constants ───────────────────────────────────────────────────────
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 30;
const OTP_EXPIRY = {
  EMAIL_VERIFICATION: 30 * 60 * 1000,
  PASSWORD_RESET: 15 * 60 * 1000,
  PHONE_VERIFICATION: 5 * 60 * 1000,
  TWO_FACTOR: 10 * 60 * 1000,
};
const MAX_OTP_ATTEMPTS = 5;
const PASSWORD_HISTORY_SIZE = 5;

// Common leaked passwords (subset for performance - extend with full list in production)
const COMMON_PASSWORDS = new Set([
  'Password1!', 'Password123!', 'Admin@123', 'Welcome1!', 'Qwerty123!',
  'letmein', '12345678', 'password', 'iloveyou', 'monkey', 'dragon',
]);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly smsService: SmsService,
  ) {}

  // ── Crypto Helpers ────────────────────────────────────────────────────────

  private generateSecureToken(bytes = 32): string {
    return crypto.randomBytes(bytes).toString('hex');
  }

  private generateSecureOtp(digits = 6): string {
    const max = 10 ** digits;
    return crypto.randomInt(0, max).toString().padStart(digits, '0');
  }

  private async hashValue(value: string): Promise<string> {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  private async hashToken(token: string): Promise<string> {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private parseUserAgent(userAgent?: string) {
    if (!userAgent) return { deviceName: null, browser: null, os: null };
    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    const browser = result.browser.name || null;
    const os = result.os.name ? `${result.os.name} ${result.os.version || ''}`.trim() : null;
    const device = result.device.model || result.device.type || 'Desktop';
    return { deviceName: device, browser, os };
  }

  private validatePasswordStrength(password: string): void {
    if (COMMON_PASSWORDS.has(password)) {
      throw new BadRequestException('Password is too common. Please choose a stronger password.');
    }
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[@$!%*?&^#()_+=\-]/.test(password);
    if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      throw new BadRequestException(
        'Password must contain uppercase, lowercase, digit, and special character.',
      );
    }
  }

  // ── Registration ──────────────────────────────────────────────────────────

  async register(dto: RegisterDto) {
    this.validatePasswordStrength(dto.password);

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const hashed = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        fullName: `${dto.firstName} ${dto.lastName}`,
        email: dto.email,
        phone: dto.phone,
        password: hashed,
        role: dto.role || UserRole.CLIENT,
        passwordChangedAt: new Date(),
        passwordHistory: [hashed],
        profile: dto.role === UserRole.CLIENT || !dto.role ? { create: {} } : undefined,
      },
    });

    const verificationToken = await this.generateOtp(
      user.id, dto.email, OtpType.EMAIL_VERIFICATION,
    );
    await this.mailService.sendVerificationEmail(user.email, user.firstName, verificationToken);

    return {
      userId: user.id,
      email: user.email,
      message: 'Registration successful. Check your email to verify.',
    };
  }

  // ── Login ─────────────────────────────────────────────────────────────────

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.password) throw new UnauthorizedException('Invalid credentials');
    if (user.deletedAt) throw new UnauthorizedException('Account has been deactivated');
    if (user.status === 'BANNED') throw new UnauthorizedException('Account has been banned');

    // Check account lock
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remaining = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(
        `Account locked due to too many failed attempts. Try again in ${remaining} minutes.`,
      );
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      await this.handleFailedLogin(user.id, ip);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) throw new UnauthorizedException('Please verify your email first');

    // Reset failed login counter on success
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ip,
      },
    });

    await this.logSecurityEvent(user.id, 'LOGIN_SUCCESS', ip, userAgent);

    return this.generateTokens(user.id, user.email, user.role, user.tokenVersion, ip, userAgent);
  }

  private async handleFailedLogin(userId: string, ip?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const newCount = (user.failedLoginCount || 0) + 1;
    const lockData: any = { failedLoginCount: newCount };

    if (newCount >= MAX_LOGIN_ATTEMPTS) {
      lockData.lockedUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);
      lockData.failedLoginCount = 0;
      await this.logSecurityEvent(userId, 'ACCOUNT_LOCKED', ip);
    }

    await this.prisma.user.update({ where: { id: userId }, data: lockData });
  }

  private async logSecurityEvent(
    userId: string,
    eventType: string,
    ip?: string,
    userAgent?: string,
    metadata?: any,
  ) {
    await this.prisma.securityEvent.create({
      data: { userId, eventType, ipAddress: ip, userAgent, metadata },
    });
    // Also write to activity log for admin visibility
    await this.prisma.activityLog.create({
      data: { userId, action: eventType, entity: 'auth', ipAddress: ip, userAgent },
    });
  }

  // ── Token Generation ──────────────────────────────────────────────────────

  async generateTokens(
    userId: string,
    email: string,
    role: string,
    tokenVersion: number,
    ip?: string,
    userAgent?: string,
  ) {
    const { deviceName, browser, os } = this.parseUserAgent(userAgent);
    const jti = crypto.randomUUID();

    const payload = {
      sub: userId,
      email,
      role,
      ver: tokenVersion,
      jti,
      iss: 'pridehub',
      aud: 'pridehub-api',
    };

    const accessToken = this.jwtService.sign(payload);

    // Generate cryptographically secure refresh token
    const rawRefreshToken = this.generateSecureToken(48);
    const tokenHash = await this.hashToken(rawRefreshToken);
    const family = crypto.randomUUID();

    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn', '7d');
    const days = parseInt(refreshExpiresIn) || 7;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        family,
        expiresAt,
        ipAddress: ip,
        userAgent,
        deviceName,
        browser,
        os,
        lastUsedAt: new Date(),
      },
    });

    return { accessToken, refreshToken: rawRefreshToken, tokenType: 'Bearer' };
  }

  // ── Refresh ───────────────────────────────────────────────────────────────

  async refreshTokens(rawRefreshToken: string, ip?: string, userAgent?: string) {
    const tokenHash = await this.hashToken(rawRefreshToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken) {
      // Unknown token — could be theft. No family to trace, just reject.
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Detect refresh token reuse (token was already revoked)
    if (storedToken.revokedAt) {
      // Revoke entire family (possible token theft)
      await this.prisma.refreshToken.updateMany({
        where: { family: storedToken.family, revokedAt: null },
        data: { revokedAt: new Date(), revokeReason: 'TOKEN_REUSE_DETECTED' },
      });
      await this.logSecurityEvent(
        storedToken.userId,
        'REFRESH_TOKEN_REUSE_DETECTED',
        ip,
        userAgent,
        { family: storedToken.family },
      );
      throw new UnauthorizedException('Refresh token reuse detected. All sessions revoked for security.');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    const { user } = storedToken;
    if (!user || user.deletedAt || user.status === 'BANNED') {
      throw new UnauthorizedException('User account is not active');
    }

    // Rotate: revoke current token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date(), revokeReason: 'ROTATED' },
    });

    return this.generateTokens(user.id, user.email, user.role, user.tokenVersion, ip, userAgent);
  }

  // ── Email Verification ────────────────────────────────────────────────────

  async verifyEmail(code: string) {
    const codeHash = await this.hashValue(code);

    const otp = await this.prisma.otp.findFirst({
      where: {
        codeHash,
        type: OtpType.EMAIL_VERIFICATION,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otp) {
      // Increment attempts if we can find it (to prevent brute force)
      throw new BadRequestException('Invalid or expired verification code');
    }

    if (otp.attempts >= MAX_OTP_ATTEMPTS) {
      throw new BadRequestException('Maximum verification attempts exceeded. Request a new code.');
    }

    await this.prisma.otp.update({ where: { id: otp.id }, data: { usedAt: new Date() } });
    await this.prisma.user.update({
      where: { id: otp.userId! },
      data: { isEmailVerified: true, status: 'ACTIVE' },
    });

    return { message: 'Email verified successfully' };
  }

  // ── Password Reset ────────────────────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    // Always return same response to prevent user enumeration
    if (!user) return { message: 'If the email exists, a reset link has been sent' };

    const token = await this.generateOtp(user.id, dto.email, OtpType.PASSWORD_RESET);
    await this.mailService.sendPasswordResetEmail(user.email, user.firstName, token);
    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    this.validatePasswordStrength(dto.newPassword);
    const codeHash = await this.hashValue(dto.token);

    const otp = await this.prisma.otp.findFirst({
      where: {
        codeHash,
        type: OtpType.PASSWORD_RESET,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (!otp) throw new BadRequestException('Invalid or expired token');

    // Check password history to prevent reuse
    const user = await this.prisma.user.findUnique({ where: { id: otp.userId! } });
    if (!user) throw new NotFoundException('User not found');

    await this.checkPasswordHistory(dto.newPassword, user.passwordHistory);

    const hashed = await bcrypt.hash(dto.newPassword, 12);

    // Build new password history (keep last N)
    const history = [hashed, ...(user.passwordHistory || [])].slice(0, PASSWORD_HISTORY_SIZE);

    await this.prisma.otp.update({ where: { id: otp.id }, data: { usedAt: new Date() } });
    await this.prisma.user.update({
      where: { id: otp.userId! },
      data: {
        password: hashed,
        passwordChangedAt: new Date(),
        passwordHistory: history,
        tokenVersion: { increment: 1 }, // Invalidate all existing JWTs
      },
    });

    // Revoke all active refresh tokens
    await this.prisma.refreshToken.updateMany({
      where: { userId: otp.userId!, revokedAt: null },
      data: { revokedAt: new Date(), revokeReason: 'PASSWORD_RESET' },
    });

    await this.logSecurityEvent(otp.userId!, 'PASSWORD_RESET');

    return { message: 'Password reset successfully' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    this.validatePasswordStrength(dto.newPassword);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.password) throw new NotFoundException('User not found');

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) throw new BadRequestException('Current password is incorrect');

    await this.checkPasswordHistory(dto.newPassword, user.passwordHistory);

    const hashed = await bcrypt.hash(dto.newPassword, 12);
    const history = [hashed, ...(user.passwordHistory || [])].slice(0, PASSWORD_HISTORY_SIZE);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashed,
        passwordChangedAt: new Date(),
        passwordHistory: history,
        tokenVersion: { increment: 1 }, // Invalidate existing JWTs
      },
    });

    // Revoke all refresh tokens
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date(), revokeReason: 'PASSWORD_CHANGED' },
    });

    await this.logSecurityEvent(userId, 'PASSWORD_CHANGED');
    return { message: 'Password changed successfully' };
  }

  private async checkPasswordHistory(newPassword: string, history: string[]) {
    for (const oldHash of history) {
      const matches = await bcrypt.compare(newPassword, oldHash);
      if (matches) {
        throw new BadRequestException(
          `Password was recently used. Please choose a different password.`,
        );
      }
    }
  }

  // ── Logout ────────────────────────────────────────────────────────────────

  async logout(rawRefreshToken: string) {
    const tokenHash = await this.hashToken(rawRefreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revokedAt: new Date(), revokeReason: 'LOGOUT' },
    });
    return { message: 'Logged out successfully' };
  }

  async logoutAll(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date(), revokeReason: 'LOGOUT_ALL' },
    });
    await this.prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
    await this.logSecurityEvent(userId, 'LOGOUT_ALL_DEVICES');
    return { message: 'Logged out from all devices' };
  }

  async revokeSession(sessionId: string, userId: string) {
    const token = await this.prisma.refreshToken.findFirst({
      where: { id: sessionId, userId },
    });
    if (!token) throw new NotFoundException('Session not found');
    await this.prisma.refreshToken.update({
      where: { id: sessionId },
      data: { revokedAt: new Date(), revokeReason: 'USER_REVOKED' },
    });
    return { message: 'Session revoked' };
  }

  async getSessions(userId: string) {
    return this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      select: {
        id: true, deviceName: true, browser: true, os: true,
        ipAddress: true, lastUsedAt: true, createdAt: true, country: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Phone Verification ────────────────────────────────────────────────────

  async sendPhoneOtp(userId: string, phone: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const existingPhone = await this.prisma.user.findFirst({
      where: { phone, id: { not: userId } },
    });
    if (existingPhone) throw new ConflictException('Phone already associated with another account');

    if (user.phone !== phone) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { phone, isPhoneVerified: false },
      });
    }

    await this.smsService.sendOtp(phone);
    return { message: 'Verification code sent successfully' };
  }

  async verifyPhoneOtp(userId: string, phone: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.phone !== phone) throw new BadRequestException('Phone number does not match');

    await this.smsService.verifyOtp(phone, code);
    await this.prisma.user.update({ where: { id: userId }, data: { isPhoneVerified: true } });
    return { message: 'Phone number verified successfully' };
  }

  // ── OAuth Handler ─────────────────────────────────────────────────────────

  async handleOAuthLogin(
    provider: 'google' | 'facebook' | 'microsoft',
    providerId: string,
    email: string,
    firstName: string,
    lastName: string,
    avatar?: string,
    ip?: string,
    userAgent?: string,
  ) {
    const providerField = `${provider}Id` as 'googleId' | 'facebookId' | 'microsoftId';

    let user = await this.prisma.user.findFirst({
      where: { OR: [{ [providerField]: providerId }, { email }] },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          fullName: `${firstName} ${lastName}`,
          [providerField]: providerId,
          avatar,
          isEmailVerified: true,
          status: 'ACTIVE',
          role: UserRole.CLIENT,
          profile: { create: {} },
        },
      });
    } else if (!user[providerField]) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { [providerField]: providerId, avatar: user.avatar || avatar },
      });
    }

    await this.logSecurityEvent(user.id, `OAUTH_LOGIN_${provider.toUpperCase()}`, ip, userAgent);
    return this.generateTokens(user.id, user.email, user.role, user.tokenVersion, ip, userAgent);
  }

  // ── Validate User ─────────────────────────────────────────────────────────

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) return null;
    const isMatch = await bcrypt.compare(password, user.password);
    return isMatch ? user : null;
  }

  // ── 2FA / TOTP ────────────────────────────────────────────────────────────

  async enable2FA(userId: string): Promise<{ secret: string; qrCode: string }> {
    const speakeasy = await import('speakeasy');
    const secret = speakeasy.generateSecret({ length: 20, name: `PrideHub (${userId})` });

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 },
    });

    return { secret: secret.base32, qrCode: secret.otpauth_url! };
  }

  async verify2FA(userId: string, token: string): Promise<{ verified: boolean }> {
    const speakeasy = await import('speakeasy');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorSecret) throw new BadRequestException('2FA not configured');

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (verified && !user.isTwoFactorEnabled) {
      // Generate backup codes
      const codes = Array.from({ length: 10 }, () => this.generateSecureToken(4).toUpperCase());
      const hashedCodes = await Promise.all(codes.map(c => this.hashValue(c)));
      await this.prisma.user.update({
        where: { id: userId },
        data: { isTwoFactorEnabled: true, twoFactorBackupCodes: hashedCodes },
      });
      await this.logSecurityEvent(userId, 'TWO_FA_ENABLED');
      return { verified: true };
    }

    return { verified };
  }

  async disable2FA(userId: string, token: string) {
    const speakeasy = await import('speakeasy');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorSecret) throw new BadRequestException('2FA not configured');

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1,
    });
    if (!verified) throw new ForbiddenException('Invalid 2FA token');

    await this.prisma.user.update({
      where: { id: userId },
      data: { isTwoFactorEnabled: false, twoFactorSecret: null, twoFactorBackupCodes: [] },
    });
    await this.logSecurityEvent(userId, 'TWO_FA_DISABLED');
    return { message: '2FA disabled successfully' };
  }

  // ── OTP Helpers ───────────────────────────────────────────────────────────

  private async generateOtp(userId: string, email: string, type: OtpType): Promise<string> {
    const code = this.generateSecureOtp(8);
    const codeHash = await this.hashValue(code);

    let expiresMs: number;
    switch (type) {
      case OtpType.EMAIL_VERIFICATION:
        expiresMs = OTP_EXPIRY.EMAIL_VERIFICATION;
        break;
      case OtpType.PASSWORD_RESET:
        expiresMs = OTP_EXPIRY.PASSWORD_RESET;
        break;
      case OtpType.PHONE_VERIFICATION:
        expiresMs = OTP_EXPIRY.PHONE_VERIFICATION;
        break;
      default:
        expiresMs = OTP_EXPIRY.TWO_FACTOR;
    }

    const expiresAt = new Date(Date.now() + expiresMs);

    // Invalidate previous OTPs of same type
    await this.prisma.otp.updateMany({
      where: { userId, type, usedAt: null },
      data: { usedAt: new Date() },
    });

    await this.prisma.otp.create({ data: { userId, email, codeHash, type, expiresAt } });
    return code;
  }
}
