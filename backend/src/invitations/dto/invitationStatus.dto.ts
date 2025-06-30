import { IsBoolean, IsEnum, IsString } from 'class-validator';

export type InvitationStatus = "pending" | "accepted" | "declined" | "expired" | "slot cancelled";

export class InvitationStatusDto {
  
  recipientEmails:string[];
  @IsString()
  slotId: string;

  @IsEnum(["pending", "accepted", "declined", "expired", "slot cancelled"])
  invitationStatus: InvitationStatus;

  @IsBoolean()
  isActive: boolean;
}