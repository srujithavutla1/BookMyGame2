import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Slot Schema
export type SlotStatus = "available" | "booked" | "on-hold" | "failed" | "cancelled";

@Schema()
export class Slot extends Document {

  @Prop({ required: true, unique: true })
  slotId: string;
  @Prop({ required: true })
  gameId: string;

  @Prop({ required: true })
  startTime: string;

  @Prop({ required: true })
  endTime: string;

  @Prop({ enum: ["available", "booked", "on-hold", "failed", "cancelled"], default: "available" })
  slotStatus: SlotStatus;

  @Prop({ default: 0 })
  peopleAdded: number;

  @Prop({ default: 0 })
  peopleAccepted: number;

  @Prop()
  heldBy: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop({ default: true })
  isActive: boolean;
}

export const SlotSchema = SchemaFactory.createForClass(Slot);

