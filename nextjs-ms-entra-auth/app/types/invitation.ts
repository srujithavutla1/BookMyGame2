// types/invitation.ts
import { User } from "./user";
import { Slot } from "./booking";

export type InvitationStatus = "pending" | "accepted" | "declined" | "expired"|"slot cancelled";

export interface Invitation {
  invitationId: number;
  slotId: string;
  senderEmail: string;
  recipientEmail: string;
  invitationStatus: InvitationStatus;
  sentAt: string; 
  respondedAt?: string; 
  expiresAt: string; 
  isActive:Boolean;
}