import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ default: 3 })
  chances: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  microsoftAccessToken: string;

  @Prop()
  microsoftRefreshToken: string;

  @Prop()
  refreshToken: string;

  @Prop()
  role: string;
}

export const UserSchema = SchemaFactory.createForClass(User);