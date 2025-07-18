import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-microsoft';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { User } from 'src/users/schemas/user.schema';

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
      scope: ['User.Read', 'Chat.ReadWrite', 'Chat.Create', 'TeamsActivity.Send', 'email', 'openid', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) : Promise<User>{
    const user = await this.authService.validateUser(profile, accessToken,refreshToken);
    return user;
  }
}