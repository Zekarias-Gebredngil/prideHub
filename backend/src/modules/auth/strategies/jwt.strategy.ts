import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtUser } from '../../../common/decorators/current-user.decorator';

export interface JwtPayload extends JwtUser {
  ver: number;     // Token version — must match user.tokenVersion
  jti: string;     // JWT ID
  iss: string;     // Issuer
  aud: string;     // Audience
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService, private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret', 'change_this'),
      issuer: 'pridehub',
      audience: 'pridehub-api',
    });
  }

  async validate(payload: JwtPayload): Promise<JwtUser> {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('User account not found');
    }
    if (user.status === 'BANNED') {
      throw new UnauthorizedException('Account has been banned');
    }
    // Token version check: invalidates all tokens issued before password change
    if (payload.ver !== undefined && payload.ver !== user.tokenVersion) {
      throw new UnauthorizedException('Token has been invalidated. Please log in again.');
    }

    return { sub: user.id, email: user.email, role: user.role };
  }
}
