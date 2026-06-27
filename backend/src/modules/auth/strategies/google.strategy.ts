import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService, private readonly authService: AuthService) {
    super({
      clientID: config.get<string>('GOOGLE_CLIENT_ID', 'dummy'),
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET', 'dummy'),
      callbackURL: config.get<string>('GOOGLE_CALLBACK_URL', 'http://localhost:3000/api/v1/auth/google/callback'),
      scope: ['email', 'profile'],
      passReqToCallback: false,
    });
  }

  async validate(_accessToken: string, _refreshToken: string, profile: any, done: VerifyCallback) {
    const { id, emails, name, photos } = profile;
    const tokens = await this.authService.handleOAuthLogin(
      'google',
      id,
      emails[0].value,
      name.givenName,
      name.familyName,
      photos?.[0]?.value,
    );
    done(null, tokens);
  }
}
