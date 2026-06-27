import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { from, Subject } from 'rxjs';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get('mail.host'),
      port: config.get('mail.port'),
      auth: { user: config.get('mail.user'), pass: config.get('mail.password') },
    });
  }

  private async send(to: string, subject: string, html: string, devFallback?: string) {
    try {
      await this.transporter.sendMail({ from: this.config.get('mail.from'), to, subject, html });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${(err as Error).message}`);
      const mailPassword = this.config.get<string>('mail.password') || '';
      const usesPlaceholderCredentials = !mailPassword || mailPassword.startsWith('your_');
      if ((this.config.get('app.nodeEnv') !== 'production' || usesPlaceholderCredentials) && devFallback) {
        this.logger.warn(devFallback);
      }
    }
  }

  async sendVerificationEmail(email: string, name: string, code: string) {
    const frontendUrl = this.config.get('app.frontendUrl', 'http://localhost:4200');
    const verificationUrl = `${frontendUrl}/auth/verify-email?token=${encodeURIComponent(code)}`;
    await this.send(email, 'Verify Your Email - PrideHub', `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px;background:#f9f9f9">
        <div style="background:#8B1538;padding:20px;text-align:center;border-radius:8px 8px 0 0">
          <h1 style="color:#D4AF37;margin:0;font-size:28px">PrideHub</h1>
        </div>
        <div style="background:#fff;padding:30px;border-radius:0 0 8px 8px;box-shadow:0 2px 8px rgba(0,0,0,.1)">
          <h2 style="color:#2B2B2B">Hello, ${name}!</h2>
          <p style="color:#555;line-height:1.6">Thank you for registering with PrideHub. Click the button below to verify your email address:</p>
          <a href="${verificationUrl}" style="display:inline-block;background:#8B1538;color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;margin:16px 0">Verify Email</a>
          <p style="color:#555;line-height:1.6">Or use this verification code:</p>
          <div style="background:#8B1538;color:#D4AF37;font-size:32px;font-weight:bold;text-align:center;padding:20px;border-radius:8px;letter-spacing:8px;margin:20px 0">${code}</div>
          <p style="color:#555;font-size:14px">This code expires in 24 hours. If you did not create this account, please ignore this email.</p>
        </div>
      </div>
    `, `Development verification link for ${email}: ${verificationUrl}`);
  }

  async sendPasswordResetEmail(email: string, name: string, token: string) {
    const frontendUrl = this.config.get('app.frontendUrl', 'http://localhost:4200');
    await this.send(email, 'Reset Your Password - PrideHub', `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px;background:#f9f9f9">
        <div style="background:#8B1538;padding:20px;text-align:center;border-radius:8px 8px 0 0">
          <h1 style="color:#D4AF37;margin:0">PrideHub</h1>
        </div>
        <div style="background:#fff;padding:30px;border-radius:0 0 8px 8px">
          <h2 style="color:#2B2B2B">Hi ${name},</h2>
          <p>Click the button below to reset your password:</p>
          <a href="${frontendUrl}/auth/reset-password?token=${token}" style="display:inline-block;background:#8B1538;color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;margin:16px 0">Reset Password</a>
          <p style="color:#888;font-size:13px">This link expires in 24 hours.</p>
        </div>
      </div>
    `);
  }

  async sendBookingConfirmation(email: string, name: string, bookingNumber: string) {
    await this.send(email, `Booking Confirmed - ${bookingNumber}`, `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#8B1538;padding:20px;text-align:center">
          <h1 style="color:#D4AF37;margin:0">PrideHub</h1>
        </div>
        <div style="padding:30px;background:#fff">
          <h2>Booking Confirmed!</h2>
          <p>Hi ${name}, your booking <strong>${bookingNumber}</strong> has been received.</p>
          <p>Our team will reach out within 24 hours to discuss the details.</p>
        </div>
      </div>
    `);
  }

  async sendWelcomeEmail(email: string, name: string) {
    await this.send(email, 'Welcome to PrideHub!', `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#8B1538;padding:20px;text-align:center">
          <h1 style="color:#D4AF37;margin:0">PrideHub</h1>
          <p style="color:#F8F5F2;margin:5px 0">Where Every Celebration Comes to Life</p>
        </div>
        <div style="padding:30px;background:#fff">
          <h2>Welcome, ${name}!</h2>
          <p>We're thrilled to have you join PrideHub — Ethiopia's premier event management platform.</p>
        </div>
      </div>
    `);
  }

  async sendContactNotification(name: string, email: string, subject: string, message: string, targetAdminEmail: string) {
    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px;background:#f9f9f9">
        <div style="background:#8B1538;padding:20px;text-align:center;border-radius:8px 8px 0 0">
          <h1 style="color:#D4AF37;margin:0;font-size:28px">New Contact Message</h1>
        </div>
        <div style="background:#fff;padding:30px;border-radius:0 0 8px 8px;box-shadow:0 2px 8px rgba(0,0,0,.1)">
          <h2 style="color:#2B2B2B">You have a new message from ${name}</h2>
          <p><strong>Reply-To:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <hr style="border:0;border-top:1px solid #eee;margin:20px 0" />
          <p style="color:#555;line-height:1.6;white-space:pre-wrap">${message}</p>
        </div>
      </div>
    `;
    await this.send(targetAdminEmail, `Contact Form: ${subject}`, html, `Dev mode contact message from ${email} to ${targetAdminEmail}`);
  }
}
