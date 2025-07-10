"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Invitation, InvitationStatus } from "@/app/types/invitation";
import { Button } from "@/app/components/ui/Button";
import { User } from "@/app/types/user";
import { Slot } from "@/app/types/booking";
import { getUserByEmail, updateUserChances, updateUsers } from "../services/userService";
import { fetchInvitationsByRecipientEmail, getInvitationByInvitationId, updateInvitations, updateInvitationStatus } from "../services/invitationService";
import { getAllSlotsByInvitationRecipientEmail, updateSlots } from "../services/slotService";
import { useAuth } from "../context/AuthContext";

export async function updateSlotParticipants(slot: Slot, change: number): Promise<void> {
  try {
    const updatedSlot = {
      ...slot,
      peopleAccepted: slot.peopleAccepted! + change,
    };
    await updateSlots([updatedSlot]);
  } catch (error) {
    console.error('Error updating slot participants:', error);
    throw new Error('Failed to update slot participants');
  }
}

export default function InvitationsPage() {
  const { user: authUser } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [slots, setSlots] = useState<{ [key: string]: Slot }>({});
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const highlightedInvitationId = searchParams.get('invitationId');
  const invitationRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const fetchData = useCallback(async () => {
    if (!authUser?.email) return;
    setLoading(true);
    try {
      const [invs, allSlots] = await Promise.all([
        fetchInvitationsByRecipientEmail(authUser?.email),
        getAllSlotsByInvitationRecipientEmail(authUser?.email)
      ]);

      setInvitations(invs);
      setSlots(allSlots.reduce((acc, slot) => {
        acc[slot.slotId!] = slot;
        return acc;
      }, {} as { [key: string]: Slot }));
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!loading && highlightedInvitationId) {
      const timer = setTimeout(() => {
        const element = invitationRefs.current[highlightedInvitationId];
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });

          // Add temporary flash animation
          element.classList.add('ring-4', 'ring-blue-500');
          setTimeout(() => {
            element.classList.remove('ring-4', 'ring-blue-500');
          }, 2000);
        }
      }, 100); // Small delay to ensure DOM is fully rendered

      return () => clearTimeout(timer);
    }
  }, [loading, highlightedInvitationId]);

  const handleAccept = async (invitation: Invitation) => {
    try {
      const currentUser = await getUserByEmail(authUser?.email!);
      setUser(currentUser);

      if (user?.chances! <= 0) {
        setError('You don\'t have enough chances to accept this invitation');
        return;
      }

      const currentInvitation = await getInvitationByInvitationId(invitation.invitationId.toString());

      if (currentInvitation.invitationStatus !== 'pending') {
        setError('This invitation has already been processed, refresh the page to get new updates');
        setInvitations(prev =>
          prev.map(inv => inv.invitationId === invitation.invitationId
            ? { ...inv, invitationStatus: currentInvitation.invitationStatus, isActive: false }
            : inv
          )
        );
        return;
      }

      await updateInvitationStatus(
        [authUser?.email!],
        invitation.slotId,
        "accepted" as InvitationStatus,
        true
      );

      await updateUserChances([authUser?.email!], -1);

      const slot = slots[invitation.slotId];
      if (slot) {
        await updateSlotParticipants(slot, 1);
        setSlots(prev => ({
          ...prev,
          [slot.slotId!]: {
            ...slot,
            peopleAccepted: slot.peopleAccepted! + 1
          }
        }));
      }

      setInvitations(prev =>
        prev.map(inv => inv.invitationId === invitation.invitationId
          ? {
            ...inv,
            invitationStatus: 'accepted',
            respondedAt: new Date().toISOString(),
            isActive: true
          }
          : inv
        )
      );
    } catch (err) {
      setError('Failed to accept invitation');
      console.error(err);
    }
  };

  const handleDecline = async (invitation: Invitation) => {
    try {
      const currentInvitation = await getInvitationByInvitationId(invitation.invitationId.toString());

      if (currentInvitation.invitationStatus !== 'pending') {
        setError('This invitation has already been processed');
        setInvitations(prev =>
          prev.map(inv => inv.invitationId === invitation.invitationId
            ? { ...inv, invitationStatus: currentInvitation.invitationStatus, isActive: false }
            : inv
          )
        );
        return;
      }

      await updateInvitationStatus(
        [authUser?.email!],
        invitation.slotId,
        "declined" as InvitationStatus,
        false
      );

      setInvitations(prev =>
        prev.map(inv => inv.invitationId === invitation.invitationId
          ? {
            ...inv,
            invitationStatus: 'declined',
            respondedAt: new Date().toISOString(),
            isActive: false
          }
          : inv
        )
      );
    } catch (err) {
      setError('Failed to decline invitation');
      console.error(err);
    }
  };

  if (!authUser) return <div className="text-center mt-8">Please sign in to view invitations.</div>;
  if (loading) return <div className="text-center mt-8">Loading...</div>;
  if (error) return <div className="text-red-500 text-center mt-8">{error}</div>;

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">My Invitations</h1>
      {invitations.length === 0 ? (
        <p className="text-gray-600">No invitations found.</p>
      ) : (
        <div className="space-y-6">
          {invitations.map((invitation) => {
            const slot = slots[invitation.slotId];
            const isPendingAndActive = invitation.isActive && invitation.invitationStatus === 'pending';

            return (
              <div
                key={invitation.invitationId}
                ref={(el) => (invitationRefs.current[invitation.invitationId] = el)}
                className={`border rounded-lg p-6 shadow-md bg-white transition-all duration-300 ${highlightedInvitationId === invitation.invitationId.toString()
                    ? 'ring-2 ring-blue-500'
                    : ''
                  }`}
              >
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-700 mb-2">Invitation Details</h2>
                    <p><span className="font-medium">From:</span> {invitation.senderEmail}</p>
                    <p>
                      <span className="font-medium">Status:</span>{' '}
                      <span
                        className={`inline-block px-2 py-1 rounded ${invitation.invitationStatus === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : invitation.invitationStatus === 'accepted'
                              ? 'bg-green-100 text-green-800'
                              : invitation.invitationStatus === 'declined'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                      >
                        {invitation.invitationStatus.toUpperCase()}
                      </span>
                    </p>
                    <p><span className="font-medium">Sent:</span> {new Date(invitation.sentAt).toLocaleString()}</p>
                    {invitation.respondedAt && (
                      <p><span className="font-medium">Responded:</span> {new Date(invitation.respondedAt).toLocaleString()}</p>
                    )}
                    <p><span className="font-medium">Expires:</span> {new Date(invitation.expiresAt!).toLocaleString()}</p>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-700 mb-2">Slot Details</h2>
                    {slot ? (
                      <>
                        <p><span className="font-medium">Game:</span> {slot.gameId}</p>
                        <p><span className="font-medium">Time:</span> {slot.startTime} - {slot.endTime}</p>
                        <p><span className="font-medium">Status:</span> {slot.slotStatus}</p>
                        <p><span className="font-medium">People Added:</span> {slot.peopleAdded}</p>
                        <p><span className="font-medium">People Accepted:</span> {slot.peopleAccepted}</p>
                        <p><span className="font-medium">Held By:</span> {slot.heldBy}</p>
                        {slot.createdAt && (
                          <p><span className="font-medium">Created:</span> {new Date(slot.createdAt).toLocaleString()}</p>
                        )}
                        {slot.expiresAt && (
                          <p><span className="font-medium">Expires:</span> {new Date(slot.expiresAt).toLocaleString()}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-red-500">Slot details not found for slot ID {invitation.slotId}</p>
                    )}
                  </div>
                </div>
                {isPendingAndActive && (
                  <div className="mt-4 flex justify-end space-x-2">
                    <Button
                      onClick={() => handleAccept(invitation)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                    >
                      Accept
                    </Button>
                    <Button
                      onClick={() => handleDecline(invitation)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                    >
                      Decline
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}