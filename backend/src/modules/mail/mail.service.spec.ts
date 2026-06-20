import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

describe('MailService', () => {
  const createService = (sendMail: jest.Mock, overrides: Record<string, unknown> = {}) => {
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail });

    const values: Record<string, unknown> = {
      'mail.host': 'smtp.example.com',
      'mail.port': 587,
      'mail.user': 'user',
      'mail.password': 'test-password',
      'mail.from': 'PrideHub <noreply@pridehub.com>',
      'app.frontendUrl': 'http://localhost:4200',
      'app.nodeEnv': 'development',
      ...overrides,
    };

    return new MailService({ get: jest.fn((key: string, fallback?: unknown) => values[key] ?? fallback) } as unknown as ConfigService);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends verification emails with a clickable verification link', async () => {
    const sendMail = jest.fn().mockResolvedValue(undefined);
    const service = createService(sendMail);

    await service.sendVerificationEmail('client@example.com', 'Client', 'ABC123');

    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'client@example.com',
      subject: 'Verify Your Email - PrideHub',
      html: expect.stringContaining('http://localhost:4200/auth/verify-email?token=ABC123'),
    }));
  });

  it('logs the verification link in development when SMTP rejects the email', async () => {
    const sendMail = jest.fn().mockRejectedValue(new Error('Invalid login'));
    const service = createService(sendMail);
    const warnSpy = jest.spyOn((service as any).logger, 'warn').mockImplementation();

    await service.sendVerificationEmail('client@example.com', 'Client', 'ABC123');

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('http://localhost:4200/auth/verify-email?token=ABC123'));
  });

  it('logs the verification link with placeholder SMTP credentials', async () => {
    const sendMail = jest.fn().mockRejectedValue(new Error('Invalid login'));
    const service = createService(sendMail, {
      'app.nodeEnv': 'production',
      'mail.password': 'your_mail_password',
    });
    const warnSpy = jest.spyOn((service as any).logger, 'warn').mockImplementation();

    await service.sendVerificationEmail('client@example.com', 'Client', 'ABC123');

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('http://localhost:4200/auth/verify-email?token=ABC123'));
  });
});
