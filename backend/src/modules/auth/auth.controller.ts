import {
  Controller, Post, Body, Get, UseGuards, Req, Res, HttpCode, HttpStatus, Patch, Delete, Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import {
  RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto,
  VerifyEmailDto, RefreshTokenDto, ChangePasswordDto,
  SendPhoneOtpDto, VerifyPhoneOtpDto,
} from './dto/auth.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class TotpDto {
  @ApiProperty()
  @IsString()
  token: string;
}

// ─── Cookie Configuration ─────────────────────────────────────────────────────
const REFRESH_COOKIE = 'refresh_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  // ── Registration & Login ──────────────────────────────────────────────────

  @Public()
  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Register a new user' })
  @ResponseMessage('Registration successful')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Login with email and password' })
  @ResponseMessage('Login successful')
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const ip = req.ip;
    const ua = req.headers['user-agent'];
    const result = await this.authService.login(dto, ip, ua);

    // Set refresh token in HttpOnly cookie
    res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTIONS);
    return { accessToken: result.accessToken, tokenType: result.tokenType };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token via HttpOnly cookie' })
  @ResponseMessage('Token refreshed')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // Prefer cookie, fall back to body for legacy clients
    const rawToken =
      req.cookies?.[REFRESH_COOKIE] ||
      (req.body as any)?.refreshToken;

    if (!rawToken) throw new Error('No refresh token provided');

    const ip = req.ip;
    const ua = req.headers['user-agent'];
    const result = await this.authService.refreshTokens(rawToken, ip, ua);

    res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTIONS);
    return { accessToken: result.accessToken, tokenType: result.tokenType };
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with OTP code' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @ApiOperation({ summary: 'Request password reset' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Change current password' })
  changePassword(@CurrentUser() user: JwtUser, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout current session' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: Partial<RefreshTokenDto>,
  ) {
    const rawToken = req.cookies?.[REFRESH_COOKIE] || body?.refreshToken;
    if (rawToken) await this.authService.logout(rawToken);

    res.clearCookie(REFRESH_COOKIE, { ...COOKIE_OPTIONS, maxAge: 0 });
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout from all devices' })
  async logoutAll(@CurrentUser() user: JwtUser, @Res({ passthrough: true }) res: Response) {
    await this.authService.logoutAll(user.sub);
    res.clearCookie(REFRESH_COOKIE, { ...COOKIE_OPTIONS, maxAge: 0 });
    return { message: 'Logged out from all devices' };
  }

  // ── Session Management ────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List active sessions' })
  getSessions(@CurrentUser() user: JwtUser) {
    return this.authService.getSessions(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Revoke a specific session' })
  revokeSession(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.authService.revokeSession(id, user.sub);
  }

  // ── 2FA ───────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Enable TOTP-based 2FA' })
  enable2FA(@CurrentUser() user: JwtUser) {
    return this.authService.enable2FA(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/verify')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Verify TOTP token and activate 2FA' })
  verify2FA(@CurrentUser() user: JwtUser, @Body() dto: TotpDto) {
    return this.authService.verify2FA(user.sub, dto.token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/disable')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Disable 2FA (requires current TOTP token)' })
  disable2FA(@CurrentUser() user: JwtUser, @Body() dto: TotpDto) {
    return this.authService.disable2FA(user.sub, dto.token);
  }

  // ── Phone Verification ────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('send-phone-otp')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @ApiOperation({ summary: 'Send OTP to phone via AfroMessage' })
  sendPhoneOtp(@CurrentUser() user: JwtUser, @Body() dto: SendPhoneOtpDto) {
    return this.authService.sendPhoneOtp(user.sub, dto.phone);
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-phone-otp')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Verify phone OTP via AfroMessage' })
  verifyPhoneOtp(@CurrentUser() user: JwtUser, @Body() dto: VerifyPhoneOtpDto) {
    return this.authService.verifyPhoneOtp(user.sub, dto.phone, dto.code);
  }

  // ── OAuth ──────────────────────────────────────────────────────────────────

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth' })
  googleAuth() {}

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleCallback(
    @Req() req: Request & { user: any },
    @Res() res: Response,
  ) {
    const tokens = req.user;
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:4200');

    // Set token in HttpOnly cookie — never in URL
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, COOKIE_OPTIONS);

    // Redirect with access token only (short-lived, safe to pass as query for SPA)
    res.redirect(`${frontendUrl}/auth/oauth-success?accessToken=${tokens.accessToken}`);
  }

  @Public()
  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  @ApiOperation({ summary: 'Initiate Facebook OAuth' })
  facebookAuth() {}

  @Public()
  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  @ApiOperation({ summary: 'Facebook OAuth callback' })
  async facebookCallback(
    @Req() req: Request & { user: any },
    @Res() res: Response,
  ) {
    const tokens = req.user;
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:4200');

    res.cookie(REFRESH_COOKIE, tokens.refreshToken, COOKIE_OPTIONS);
    res.redirect(`${frontendUrl}/auth/oauth-success?accessToken=${tokens.accessToken}`);
  }
}
