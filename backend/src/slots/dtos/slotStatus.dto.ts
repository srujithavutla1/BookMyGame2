
import { IsBoolean, IsEnum, IsString } from 'class-validator';
import { Document } from 'mongoose';

// Slot Schema
export type SlotStatus = "available" | "booked" | "on-hold" | "failed" | "cancelled";

export class SlotStatusDto {

  @IsString()
  slotId: string;

  @IsEnum(["available", "booked", "on-hold", "failed", "slot cancelled"])
  slotStatus: SlotStatus;

  @IsBoolean()
  isActive: boolean;
}



