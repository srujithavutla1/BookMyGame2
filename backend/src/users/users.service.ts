import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { Cron } from '@nestjs/schedule';
import { SearchResponseDto } from './dtos/searchResponseDto';

// Temporary interface for internal processing
interface TempSearchResult extends SearchResponseDto {
  
  matchIndex: number;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findOne(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
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

  async validateUserByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
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

  async searchByEmail(query: string): Promise<SearchResponseDto[]> {
    const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const safeQuery = escapeRegex(query);

    const regex = new RegExp(`.*${safeQuery}.*\\.[^@]*@pal\\.tech$|^[^\\.]*\\..*${safeQuery}.*@pal\\.tech$`, 'i');

    const users = await this.userModel
      .find({ email: regex })
      .select('email chances')
      .exec();
    console.log(users);

    const searchResults = users.map(user => {
      const [namePart] = user.email.split('@');
      const [firstName, lastName] = namePart.split('.');

      const firstNameIndex = firstName.toLowerCase().indexOf(query.toLowerCase());
      const lastNameIndex = lastName.toLowerCase().indexOf(query.toLowerCase());

      return {
        email: user.email,
        chances: user.chances,
        matchIndex: Math.min(
          firstNameIndex !== -1 ? firstNameIndex : Infinity,
          lastNameIndex !== -1 ? lastNameIndex : Infinity
        ),
      };
    });

    return searchResults
      .sort((a, b) => a.matchIndex - b.matchIndex)
      .map(({ email, chances }) => ({ email, chances }));
  }
}