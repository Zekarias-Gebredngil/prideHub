import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { SmsService } from '../sms/sms.service';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from './dto/auth.dto';
import { UserRole, OtpType } from '@prisma/client';
import { JwtUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly smsService: SmsService,
  ) {}

  // ── Registration ──────────────────────────────────────────────────────────

  async register(dto: RegisterDto) {
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
        profile: dto.role === UserRole.CLIENT || !dto.role ? { create: {} } : undefined,
      },
    });

    const verificationToken = await this.generateOtp(user.id, dto.email, OtpType.EMAIL_VERIFICATION);
    await this.mailService.sendVerificationEmail(user.email, user.firstName, verificationToken);

    return { userId: user.id, email: user.email, message: 'Registration successful. Check your email to verify.' };
  }

  // ── Login ─────────────────────────────────────────────────────────────────

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.password) throw new UnauthorizedException('Invalid credentials');
    if (user.deletedAt) throw new UnauthorizedException('Account has been deactivated');

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    if (!user.isEmailVerified) throw new UnauthorizedException('Please verify your email first');
    if (user.status === 'BANNED') throw new UnauthorizedException('Account has been banned');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ip },
    });

    return this.generateTokens(user.id, user.email, user.role, ip, userAgent);
  }

  // ── Token Generation ──────────────────────────────────────────────────────

  async generateTokens(userId: string, email: string, role: string, ip?: string, userAgent?: string) {
    const payload: JwtUser = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = uuidv4();

    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn', '7d');
    const days = parseInt(refreshExpiresIn) || 7;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: { userId, token: refreshToken, expiresAt, ipAddress: ip, userAgent },
    });

    return { accessToken, refreshToken, tokenType: 'Bearer' };
  }

  // ── Refresh ───────────────────────────────────────────────────────────────

  async refreshTokens(refreshToken: string, ip?: string, userAgent?: string) {
    const token = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!token || token.revokedAt || token.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.refreshToken.update({ where: { id: token.id }, data: { revokedAt: new Date() } });
    return this.generateTokens(token.user.id, token.user.email, token.user.role, ip, userAgent);
  }

  // ── Email Verification ────────────────────────────────────────────────────

  async verifyEmail(code: string) {
    const otp = await this.prisma.otp.findFirst({
      where: { code, type: OtpType.EMAIL_VERIFICATION, usedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!otp) throw new BadRequestException('Invalid or expired verification code');

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
    if (!user) return { message: 'If the email exists, a reset link has been sent' };

    const token = await this.generateOtp(user.id, dto.email, OtpType.PASSWORD_RESET);
    await this.mailService.sendPasswordResetEmail(user.email, user.firstName, token);
    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const otp = await this.prisma.otp.findFirst({
      where: { code: dto.token, type: OtpType.PASSWORD_RESET, usedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!otp) throw new BadRequestException('Invalid or expired token');

    const hashed = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.otp.update({ where: { id: otp.id }, data: { usedAt: new Date() } });
    await this.prisma.user.update({ where: { id: otp.userId! }, data: { password: hashed } });

    return { message: 'Password reset successfully' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.password) throw new NotFoundException('User not found');

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) throw new BadRequestException('Current password is incorrect');

    const hashed = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    return { message: 'Password changed successfully' };
  }

  // ── Logout ────────────────────────────────────────────────────────────────

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revokedAt: new Date() },
    });
    return { message: 'Logged out successfully' };
  }

  // ── Phone Verification (AfroMessage) ──────────────────────────────────────

  async sendPhoneOtp(userId: string, phone: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Make sure phone is unique if it belongs to someone else
    const existingPhone = await this.prisma.user.findFirst({
      where: { phone, id: { not: userId } },
    });
    if (existingPhone) throw new ConflictException('Phone number is already associated with another account');

    // Update phone if it's different
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

    if (user.phone !== phone) throw new BadRequestException('Phone number does not match user account');

    await this.smsService.verifyOtp(phone, code);

    await this.prisma.user.update({
      where: { id: userId },
      data: { isPhoneVerified: true },
    });

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

    return this.generateTokens(user.id, user.email, user.role);
  }

  // ── Validate User ─────────────────────────────────────────────────────────

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) return null;
    const isMatch = await bcrypt.compare(password, user.password);
    return isMatch ? user : null;
  }

  // ── OTP Helpers ───────────────────────────────────────────────────────────

  private async generateOtp(userId: string, email: string, type: OtpType): Promise<string> {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.otp.create({ data: { userId, email, code, type, expiresAt } });
    return code;
  }
}
