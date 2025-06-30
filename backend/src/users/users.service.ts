import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';


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
      { email: { $in: emails } }, // Match all users with emails in the array
      { 
        $inc: { chances: chanceDelta },  
        $set: { lastChanceUpdatedAt: lastChanceUpdatedAt }    
      }
    ).exec();

    return { modifiedCount: result.modifiedCount };
}
}
