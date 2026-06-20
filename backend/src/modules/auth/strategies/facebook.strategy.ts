import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(config: ConfigService, private readonly authService: AuthService) {
    super({
      clientID: config.get<string>('FACEBOOK_APP_ID', 'dummy'),
      clientSecret: config.get<string>('FACEBOOK_APP_SECRET', 'dummy'),
      callbackURL: config.get<string>('FACEBOOK_CALLBACK_URL', 'http://localhost:3000/api/v1/auth/facebook/callback'),
      scope: ['email'],
      profileFields: ['id', 'emails', 'name', 'photos'],
    });
  }

  async validate(_accessToken: string, _refreshToken: string, profile: Profile, done: Function) {
    const { id, emails, name, photos } = profile;
    const tokens = await this.authService.handleOAuthLogin(
      'facebook',
      id,
      emails?.[0]?.value || `${id}@facebook.com`,
      name?.givenName || '',
      name?.familyName || '',
      photos?.[0]?.value,
    );
    done(null, tokens);
  }
}
