// types/booking.ts
import { Key } from "react";
import { User } from "./user";

export type SlotStatus = "available" | "booked" | "on-hold" | "failed"|"slot cancelled";

export interface Slot {
  slotId: string;
  gameId: string;
  startTime: string; 
  endTime: string; 
  slotStatus?: SlotStatus;
  peopleAdded?:number;
  peopleAccepted?:number;
  heldBy: string;
  createdAt?:string;
  expiresAt?:string;
  updatedAt?:string;
  isActive?:string
}
export interface CreateSlot {
  slotId: string;
  gameId: string;
  startTime: string; 
  endTime: string; 
  peopleAdded: number;
  heldBy?: string;
}