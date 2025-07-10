"use client";
import { CreateSlot, Slot } from "@/app/types/booking";
import { Game } from "@/app/types/game";
import { UserEmailAndChances } from "@/app/types/user";
import { CreateInvitation } from "@/app/types/invitation";
import { useState, useEffect } from "react";
import { Button } from "../ui/Button";
import { getUserByEmail, getUsers, getUsersBySearchQuery, updateUserChances, } from "@/app/services/userService";
import { createInvitations, getInvitationBySlotIdAndRecipientEmail, getInvitationsBySlotId, updateInvitationStatus } from "@/app/services/invitationService";
import { createSlot, getSlotStatus, updateSlotPeopleAdded } from "@/app/services/slotService";
import { Trash2 } from "lucide-react";
import { useDebounce } from "@/app/utils/useDebounce";
interface BookingFormProps {
  slot: Slot;
  game: Game;
  userEmail: string;
  onClose: () => void;
  onSuccess: () => void;
}
//intersection
const findCommonParticipants = (arr1: string[], arr2: string[]): string[] => {
  return arr1.filter(a1 =>
    arr2.some(a2 => a1 === a2)
  );
};

export default function BookingForm({
  slot,
  game,
  userEmail,
  onClose,
  onSuccess
}: BookingFormProps) {
  const [newRecipientEmails, setNewRecipientEmails] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<UserEmailAndChances[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [oldRecipientEmails, setOldRecipientEmails] = useState<string[]>([]);//before edit
  const isEditMode = slot.slotStatus === "on-hold" && slot.heldBy === userEmail;
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        if (isEditMode) {
          const invitations = await getInvitationsBySlotId(slot.slotId);
          const participantEmails = invitations
            .filter(inv => inv.isActive)
            .map(inv => inv.recipientEmail);


          setOldRecipientEmails(participantEmails);//constant in edit mode
          setNewRecipientEmails(participantEmails);//changes in edit mode
        }
      } catch (error) {
        console.error('Failed to load users:', error);
        setError('Failed to load user data');
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, [isEditMode, userEmail]);

  useEffect(() => {
    const searchUsers = async () => {
      if (!debouncedSearchQuery) {
        setFilteredUsers([]);
        return;
      }

      try {
        setIsSearching(true);
        const searchResults = await getUsersBySearchQuery(debouncedSearchQuery);
        const filtered = searchResults.filter(
          user =>
            user.email !== userEmail &&
            !newRecipientEmails.includes(user.email)
        );
        setFilteredUsers(filtered);
      } catch (error) {
        console.error('Search failed:', error);
        setFilteredUsers([]);
      } finally {
        setIsSearching(false);
      }
    };

    searchUsers();
  }, [debouncedSearchQuery, userEmail, newRecipientEmails]);

  const handleAddParticipant = (user: UserEmailAndChances) => {
    if (newRecipientEmails.length >= game.maxPlayers - 1) {
      setError(`Maximum ${game.maxPlayers} players allowed`);
      return;
    }
    setNewRecipientEmails([...newRecipientEmails, user.email]);
    setSearchQuery("");
    setError("");
  };

  const handleRemoveParticipant = async (email: string) => {
    if (isEditMode) {
      try {
        const invitation = await getInvitationBySlotIdAndRecipientEmail(slot.slotId, email);
        if (invitation.invitationStatus == 'accepted') {
          setError('Cannot remove participant - they have accepted the invitation');
          return;
        }
        setNewRecipientEmails(newRecipientEmails.filter((p) => p !== email));
        setError("");
      } catch (error) {
        console.error('Failed to update invitation:', error);
        setError('Failed to remove participant');
        return;
      }
    } else {

      setNewRecipientEmails(newRecipientEmails.filter((p) => p !== email));
      setError("");
    }
  };

  const handleSubmit = async () => {
    const isBooked = await getSlotStatus(game.gameId, slot.startTime, slot.endTime);

    if (isBooked && !isEditMode) {
      setError("The slot you were trying to book is on hold or booked, please try booking other slot ");
      return;
    }

    if (!isEditMode) {
      const currentUser = await getUserByEmail(userEmail);
      if (!currentUser || currentUser.chances <= 0) {
        setError("You don't have enough chances to book this slot");
        return;
      }
    }

    if (newRecipientEmails.length + 1 < game.minPlayers) {
      setError(`Minimum ${game.minPlayers} players required`);
      return;
    }
    setIsSubmitting(true);
    setError("");


    try {
      if (!isEditMode) {
        await updateUserChances([userEmail], -1);
      }
      if (!isEditMode) {
        const newSlot: CreateSlot = {
          slotId: slot.slotId,
          gameId: slot.gameId,
          startTime: slot.startTime,
          endTime: slot.endTime,
          peopleAdded: newRecipientEmails.length + 1,
          heldBy: slot.heldBy
        }
        await createSlot(newSlot);
      }
      else {

        await updateSlotPeopleAdded(slot.slotId, newRecipientEmails.length + 1);
      }
      if (isEditMode) {
        const commonParticipants = findCommonParticipants(newRecipientEmails, oldRecipientEmails);
        const participantsToCancel = oldRecipientEmails.filter(participant =>
          !commonParticipants?.some(common => participant === common)
        );

        await updateInvitationStatus(participantsToCancel, slot.slotId, "slot cancelled", false);
        const participantsToCreate = newRecipientEmails.filter(current =>
          !commonParticipants?.some(common => current === common)
        );

        const newInvitations: CreateInvitation[] = participantsToCreate.map(participant => ({
          slotId: slot.slotId,
          recipientEmail: participant,
        }));
        const createdInvitations = await createInvitations([...newInvitations]);

      }
      else {
        const newInvitations: CreateInvitation[] = newRecipientEmails.map(participant => ({
          slotId: slot.slotId,
          recipientEmail: participant,
        }));
        const createdInvitations = await createInvitations([...newInvitations]);
      }
      onSuccess();
      onClose();

    } catch (error) {
      console.error("Booking failed:", error);
      setError("Failed to complete booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-4 text-center">Loading users...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">
        {isEditMode ? "Edit Booking" : "Book"} {game.name} at {slot.startTime}
      </h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Invite Participants ({newRecipientEmails.length + 1}/{game.maxPlayers})
        </label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by email"
          className="w-full p-2 border rounded-md"
          disabled={isSubmitting}
        />

        {isSearching && (
          <div className="mt-2 text-sm text-gray-500">Searching...</div>
        )}

        {searchQuery && !isSearching && filteredUsers.length > 0 && (
          <ul className="mt-2 border rounded-md max-h-40 overflow-y-auto">
            {filteredUsers.map((user) => (
              <li
                key={user.email}
                className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                onClick={() => handleAddParticipant(user)}
              >
                <span>
                  ({user.email}) - Chances: {user.chances}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-1">
          Current Participants:
        </h3>
        <ul className="space-y-2">

          {newRecipientEmails.map((email) => (
            <li
              key={email}
              className="p-2 bg-gray-50 rounded-md flex justify-between items-center"
            >
              <span>
                ({email})
              </span>
              <button
                onClick={() => handleRemoveParticipant(email)}
                className="text-red-500 hover:text-red-700"
                disabled={isSubmitting}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="flex justify-end space-x-2">
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || isLoading}
        >
          {isSubmitting ? "Processing..." : isEditMode ? "Update Booking" : "confirm booking"}
        </Button>
      </div>
    </div>
  );
}