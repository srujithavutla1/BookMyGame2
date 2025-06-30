import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
// Game Schema
@Schema()
export class Game extends Document {

  @Prop({ required: true, unique: true })
  gameId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  minPlayers: number;

  @Prop({ required: true })
  maxPlayers: number;

  @Prop()
  image: string;

  @Prop()
  description: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const GameSchema = SchemaFactory.createForClass(Game);