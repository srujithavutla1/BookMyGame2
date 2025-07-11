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

  @Prop({
    default: null,
    required: false,
    validate: {
      validator: function(v: string) {
        if (!v) return true; 
        return v.length >= 8;
      },
      message: 'Password must be at least 8 characters long'
    }
  })
  password: string;

  @Prop({ default: false })
  hasPassword: boolean;

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
}

export const UserSchema = SchemaFactory.createForClass(User);
