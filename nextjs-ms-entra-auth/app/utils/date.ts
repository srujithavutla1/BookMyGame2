
import { Slot, SlotStatus } from "../types/booking";


import { getAllActiveSlotsByGameId, getSlotsByGameId } from "../services/slotService";
function generateGUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}


export async function generateTimeSlots(gameId: string, email: string): Promise<Slot[]> {
  const slots: Slot[] = [];
  const startHour = 9; 
  const endHour = 21; 

  let existingSlots: Slot[] = await getAllActiveSlotsByGameId(gameId);
  

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const startTime = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      const endHour = minute === 30 ? hour + 1 : hour;
      const endMinute = minute === 30 ? 0 : 30;
      const endTime = `${endHour.toString().padStart(2, "0")}:${endMinute
        .toString()
        .padStart(2, "0")}`;

      const slotId =  generateGUID();
      
      const existingSlot = existingSlots.find(s => s.startTime===startTime&& s.slotStatus!== 'failed' && s.slotStatus !=='slot cancelled');
      if (existingSlot) {
        slots.push(existingSlot);
      } else {
        slots.push({
          slotId: slotId,
          gameId,
          startTime,
          endTime,
          slotStatus:"available" as SlotStatus,
          heldBy: email
        });
      }
    }
  }

  return slots;
}


export function calculateSlotStatus(slot: Slot, userEmail?: string): SlotStatus  {
  if (!slot) return "available" as SlotStatus;
  
  if (slot.slotStatus === "booked" as SlotStatus) {
    if (slot.heldBy===userEmail) {
      return "booked-by-you" as SlotStatus;
    }
    return "booked";
  }
  
  if (slot.slotStatus === "on-hold" as SlotStatus) {
    if (slot.heldBy === userEmail) {
      return "on-hold-by-you" as SlotStatus;
    }
    return "on-hold" as SlotStatus;
  }
  
  return "available" as SlotStatus;
}

export function isWithinAllowedHours(): boolean {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; 
  const istTime = new Date(now.getTime() + istOffset);
  const hours = istTime.getUTCHours();
  
  return hours >= 0 && hours < 24; 
}