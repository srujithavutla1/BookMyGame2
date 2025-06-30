// src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/schemas/user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(profile: any): Promise<User> {
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
      });
      await user.save();
    }

    return user;
  }

  async login(user: User) {
    const payload = { 
      sub: user.userId, 
      email: user.email,
      name: user.name,
    };
    console.log(payload);
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async validateToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch (e) {
      return null;
    }
  }
}