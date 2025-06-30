// src/auth/strategies/microsoft.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-microsoft';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.getOrThrow<string>('MICROSOFT_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('MICROSOFT_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('MICROSOFT_CALLBACK_URL'),
      tenant: configService.getOrThrow<string>('MICROSOFT_TENANT_ID'),
      scope: ['user.read'],
    });
  }
  // ... rest of the code

  async validate(accessToken: string, refreshToken: string, profile: any) {
    // Here you can find or create the user in your database
    const user = await this.authService.validateUser(profile);
    return user;
  }
}