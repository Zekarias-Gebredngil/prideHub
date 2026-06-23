import { Injectable, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly smsToken: string;
  private readonly otpToken: string;
  private readonly senderId: string;

  constructor(private readonly configService: ConfigService) {
    this.smsToken = this.configService.get<string>('AFROMESSAGE_SMS_TOKEN') || '';
    this.otpToken = this.configService.get<string>('AFROMESSAGE_OTP_TOKEN') || '';
    this.senderId = this.configService.get<string>('AFROMESSAGE_SENDER_ID') || '';
  }

  /**
   * Sends a standard SMS message using the AfroMessage API.
   */
  async sendSms(to: string, message: string): Promise<any> {
    if (!this.smsToken) {
      this.logger.warn('AFROMESSAGE_SMS_TOKEN is not configured. Skipping SMS.');
      return;
    }

    try {
      const url = new URL('https://api.afromessage.com/api/send');
      url.searchParams.append('to', to);
      url.searchParams.append('message', message);
      if (this.senderId) {
        url.searchParams.append('from', this.senderId);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.smsToken}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();
      if (!response.ok || data.acknowledge !== 'success') {
        throw new Error(data.message || 'Failed to send SMS');
      }

      this.logger.log(`SMS sent successfully to ${to}`);
      return data;
    } catch (error: any) {
      this.logger.error(`Error sending SMS to ${to}: ${error.message}`);
      throw new InternalServerErrorException('Failed to send SMS message');
    }
  }

  /**
   * Triggers an OTP code to be sent to the user using AfroMessage's Challenge API.
   */
  async sendOtp(to: string): Promise<any> {
    if (!this.otpToken) {
      this.logger.warn('AFROMESSAGE_OTP_TOKEN is not configured. Skipping OTP.');
      return;
    }

    try {
      const url = new URL('https://api.afromessage.com/api/challenge');
      if (this.senderId) url.searchParams.append('from', this.senderId);
      if (this.senderId) url.searchParams.append('sender', this.senderId);
      url.searchParams.append('to', to);
      url.searchParams.append('pr', 'PrideHub Verification Code: ');
      url.searchParams.append('sb', '1'); // space before
      url.searchParams.append('sa', '1'); // space after
      url.searchParams.append('ttl', '0');
      url.searchParams.append('tlen', '0');
      url.searchParams.append('t', '0'); // numeric only

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.otpToken}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();
      if (!response.ok || data.acknowledge !== 'success') {
        throw new Error(data.response?.errors?.[0] || 'Failed to send OTP');
      }

      this.logger.log(`OTP challenge initiated for ${to}`);
      return data;
    } catch (error: any) {
      this.logger.error(`Error sending OTP to ${to}: ${error.message}`);
      throw new InternalServerErrorException('Failed to send verification code');
    }
  }

  /**
   * Verifies the user-provided code against the AfroMessage Verify API.
   */
  async verifyOtp(to: string, code: string): Promise<any> {
    if (!this.otpToken) {
      throw new InternalServerErrorException('OTP service is not properly configured');
    }

    try {
      const url = new URL('https://api.afromessage.com/api/verify');
      url.searchParams.append('to', to);
      url.searchParams.append('code', code);
      url.searchParams.append('vc', '1'); // Check if verification is correct

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.otpToken}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new BadRequestException(data.response?.errors?.[0] || 'Verification failed');
      }

      if (data.acknowledge !== 'success') {
        throw new BadRequestException('Invalid verification code');
      }

      this.logger.log(`OTP successfully verified for ${to}`);
      return data;
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Error verifying OTP for ${to}: ${error.message}`);
      throw new BadRequestException('Invalid or expired verification code');
    }
  }
}
