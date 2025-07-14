import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ required: true, unique: true })
  userId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ default: 3 })
  chances: number;

  @Prop()
  lastChanceUpdatedAt: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: null })
  microsoftAccessToken: string;

  @Prop({ default: null })
  microsoftRefreshToken: string;

  @Prop({ 
    type: String, 
    enum: ['admin', 'user'], 
    default: 'user'
  })
  role: string;
}

export const UserSchema = SchemaFactory.createForClass(User);