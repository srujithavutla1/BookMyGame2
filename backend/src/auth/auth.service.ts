import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/schemas/user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(profile: any, accessToken: string, refreshToken: string): Promise<User> {
    const { displayName, emails, id } = profile;
    const email = emails[0].value;

    let user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      user = new this.userModel({
        userId: id,
        name: displayName,
        email: email,
        chances: 3,
        isActive: true,
        microsoftAccessToken: accessToken,
        microsoftRefreshToken: refreshToken,
      });
    } else {
      user.microsoftAccessToken = accessToken;
      user.microsoftRefreshToken = refreshToken;
    }
    await user.save();

    return user;
  }

  async login(user: User) {
    const payload = {
      sub: user.userId,
      email: user.email,
      role: user.role,
    };
    
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.getJwtExpiration(),
    });
    
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d', // Refresh token valid for 7 days
      secret: this.getJwtRefreshSecret(),
    });

    // Store refresh token securely (hashed)
    await this.userModel.findOneAndUpdate(
      { email: user.email },
      { refreshToken: await bcrypt.hash(refreshToken, 10) },
    ).exec();

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async validateUserByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }

  async refreshToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string }> {
    try {
      // Verify refresh token
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.getJwtRefreshSecret(),
      });

      // Find user and verify stored refresh token
      const user = await this.userModel.findOne({ email: payload.email }).exec();
      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Verify stored hashed refresh token
      const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
      if (!isValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new access and refresh tokens
      const newPayload = {
        sub: user.userId,
        email: user.email,
        role: user.role,
      };

      const accessToken = this.jwtService.sign(newPayload, {
        expiresIn: this.getJwtExpiration(),
      });

      const newRefreshToken = this.jwtService.sign(newPayload, {
        expiresIn: '7d',
        secret: this.getJwtRefreshSecret(),
      });

      // Update stored refresh token
      await this.userModel.findOneAndUpdate(
        { email: user.email },
        { refreshToken: await bcrypt.hash(newRefreshToken, 10) },
      ).exec();

      return {
        access_token: accessToken,
        refresh_token: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(email: string): Promise<void> {
    // Clear stored refresh token on logout
    await this.userModel.findOneAndUpdate(
      { email },
      { $unset: { refreshToken: '' } },
    ).exec();
  }

  private getJwtExpiration(): string {
    return process.env.JWT_EXPIRATION || '1h';
  }

  private getJwtRefreshSecret(): string {
    return process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh';
  }
}