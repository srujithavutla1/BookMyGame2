
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type InvitationStatus = "pending" | "accepted" | "declined" | "expired" | "slot cancelled";

@Schema()
export class Invitation extends Document {

  @Prop({ required: true, unique: true })
  invitationId: string;
  @Prop({ required: true })
  slotId: string;

  @Prop({ required: true })
  senderEmail: string;

  @Prop({ required: true })
  recipientEmail: string;

  @Prop({ enum: ["pending", "accepted", "declined", "expired", "slot cancelled"], default: "pending" })
  invitationStatus: InvitationStatus;

  @Prop({ default: Date.now })
  sentAt: Date;

  @Prop()
  respondedAt: Date;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: true })
  isActive: boolean;
}

export const InvitationSchema = SchemaFactory.createForClass(Invitation);