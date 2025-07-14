import { CreateSlot, Slot, SlotStatus } from "../types/booking";
import { Invitation } from "../types/invitation";
import { apiBase } from "./apiBase";

export const getSlots = async (): Promise<Slot[]> => {
  return apiBase.get<Slot[]>('/slots');
};

export const getSlotsByGameId = async (gameId: string): Promise<Slot[]> => {
  return apiBase.get<Slot[]>(`/slots/getAllSlotsByGameId?gameId=${gameId}`);
};

export const getAllActiveSlotsByGameId = async (gameId: string): Promise<Slot[]> => {
  return apiBase.get<Slot[]>(`/slots/getAllActiveSlotsByGameId?gameId=${gameId}`);
};

export const createSlot = async (slots: CreateSlot): Promise<void> => {
  await apiBase.post<void>('/slots/createSlot', slots);
};

export const updateSlotPeopleAdded = async (slotId: string, peopleAdded: number): Promise<void> => {
  await apiBase.post<void>('/slots/updateSlotPeopleAdded', {
    slotId,
    peopleAdded
  });
};

export const updateSlotStatus = async (
  slotId: string,
  slotStatus: SlotStatus,
  isActive: boolean
): Promise<Slot> => {
  return apiBase.post<Slot>('/slots/updateSlotStatus', {
    slotId,
    slotStatus,
    isActive
  });
};

export const updateSlots = async (slots: Slot[]): Promise<void> => {
  await apiBase.post<void>('/slots', slots);
};

export const getUserSlots = async (email: string): Promise<Slot[]> => {
  return apiBase.get<Slot[]>(`/slots/getAllUserSlots?recipientEmail=${email}`);
};

export const getExpiredSlots = async (gameId: string): Promise<Slot[]> => {
  return apiBase.get<Slot[]>(`/slots/getAllExpiredSlots?gameId=${gameId}`);
};

export const getSlotStatus = async (
  gameId: string,
  startTime: string,
  endTime: string
): Promise<Slot[]> => {
  return apiBase.get<Slot[]>(
    `/slots/getSlotStatus?gameId=${gameId}&startTime=${startTime}&endTime=${endTime}`
  );
};

export const getAllSlotsByInvitationRecipientEmail = async (email: string): Promise<Slot[]> => {
  return apiBase.get<Slot[]>(`/slots/getAllSlotsByInvitationRecipientEmail?recipientEmail=${email}`);
};

export const getSlotsAndInvitationsByGameId = async (
  gameId: string,
  startTime: string,
  endTime: string
): Promise<{ slots: Slot[]; invitations: Invitation[] }> => {
  return apiBase.get<{ slots: Slot[]; invitations: Invitation[] }>(
    `/slots/SlotsAndInvitationsByGameId?gameId=${gameId}&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`
  );
};