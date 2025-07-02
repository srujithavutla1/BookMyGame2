import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findOne(email: string): Promise<User|null> {
    return this.userModel.findOne({email}).exec();
  }

 
  async update(users: User[]): Promise<User[]> {
    const operations = users.map(user => ({
      updateOne: {
        filter: { userId: user.userId },
        update: { $set: user },
        upsert: true
      }
    }));
    
    await this.userModel.bulkWrite(operations);
    return this.userModel.find({
      userId: { $in: users.map(u => u.userId) }
    }).exec();
  }

  async updateChances(emails: string[], chanceDelta: number): Promise<{ modifiedCount: number }> {
    const lastChanceUpdatedAt = new Date();
    
    const result = await this.userModel.updateMany(
      { email: { $in: emails } },
      { 
        $inc: { chances: chanceDelta },  
        $set: { lastChanceUpdatedAt: lastChanceUpdatedAt }    
      }
    ).exec();

    return { modifiedCount: result.modifiedCount };
  }
  @Cron('0 8 * * *', {
    timeZone: 'Asia/Kolkata' 
  })
  async resetUserChances() {
    try {
      const result = await this.userModel.updateMany(
        {},
        { 
          $set: { 
            chances: 3,
            lastChanceUpdatedAt: new Date()
          }
        }
      );
      return { success: true, usersUpdated: result.modifiedCount };
    } catch (error) {
      console.error('Failed to reset user chances:', error);
      throw error;
    }
  }
}