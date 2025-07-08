
// services/invitationService.ts
import { CreateInvitation, Invitation, InvitationStatus } from "../types/invitation";
import { apiBase } from "./apiBase";

export const getInvitationsBySlotId = async (slotId: string): Promise<Invitation[]> => {
  return apiBase.get<Invitation[]>(`/invitations/getAllInvitationsBySlotId?slotId=${slotId}`);
};

export const getInvitationByInvitationId = async (invitationId: string): Promise<Invitation> => {
  return apiBase.get<Invitation>(`/invitations/getInvitationByInvitationId?invitationId=${invitationId}`);
};

export const getInvitationBySlotIdAndRecipientEmail = async (
  slotId: string,
  recipientEmail: string
): Promise<Invitation> => {
  return apiBase.get<Invitation>(
    `/invitations/getInvitationBySlotIdAndRecipientEmail?slotId=${slotId}&recipientEmail=${encodeURIComponent(recipientEmail)}`
  );
};

export const updateInvitations = async (invitations: Invitation[]): Promise<Invitation[]> => {
  return apiBase.post<Invitation[]>('/invitations', invitations);
};

export const updateInvitationStatus = async (
  recipientEmails: string[],
  slotId: string,
  invitationStatus: InvitationStatus,
  isActive: boolean
): Promise<Invitation[]> => {
  return apiBase.post<Invitation[]>('/invitations/updateInvitationStatus', {
    recipientEmails,
    slotId,
    invitationStatus,
    isActive
  });
};

export const fetchInvitationsByRecipientEmail = async (recipientEmail: string): Promise<Invitation[]> => {
  return apiBase.get<Invitation[]>(
    `/invitations/getAllInvitationsByRecipientEmail?recipientEmail=${encodeURIComponent(recipientEmail)}`
  );
};

export const createInvitations = async (invitations: CreateInvitation[]): Promise<Invitation[]> => {
  return apiBase.post<Invitation[]>('/invitations/create', invitations);
};

