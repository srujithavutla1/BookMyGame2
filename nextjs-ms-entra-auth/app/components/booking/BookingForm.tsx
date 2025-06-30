"use client";
import { CreateSlot, Slot } from "@/app/types/booking";
import { Game } from "@/app/types/game";
import { User } from "@/app/types/user";
import { Invitation, InvitationStatus } from "@/app/types/invitation";
import { useState, useEffect } from "react";
import { Button } from "../ui/Button";
import { getUserByEmail, getUsers, updateUserChances, updateUsers} from "@/app/services/userService";
import {  getInvitationBySlotIdAndRecipientEmail, getInvitationsBySlotId,  updateInvitations, updateInvitationStatus } from "@/app/services/invitationService";
import {  createSlot,  getSlotsByGameId,  getSlotStatus,  updateSlotPeopleAdded } from "@/app/services/slotService";
import { Trash2 } from "lucide-react";

interface BookingFormProps {
  slot: Slot;
  game: Game;
  userEmail: string;
  onClose: () => void;
  onSuccess: () => void; 
}
const findCommonParticipants = (arr1: string[], arr2: string[]): string[] => {
  return arr1.filter(a1 => 
    arr2.some(a2 => a1===a2)
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
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [invitations,setInvitations]=useState<Invitation[]>([]);
  const [oldRecipientEmails,setOldRecipientEmails]=useState<string[]>([]);//before edit
  const [newUsers,setNewUsers]=useState<User[]>([]);
  const isEditMode = slot.slotStatus === "on-hold" && slot.heldBy === userEmail;
  
   useEffect(() => {
    const loadUsers = async () => {
      try {
         const fetchedUsers = await getUsers();
        setUsers(fetchedUsers);
        
        if (isEditMode) {
         const invitations = await getInvitationsBySlotId(slot.slotId);
          const participantEmails = invitations
            .filter(inv => inv.isActive)
            .map(inv => inv.recipientEmail);
          
          const existingUsers = fetchedUsers.filter(user => 
            participantEmails.includes(user.email)
          );
          setNewUsers(existingUsers);
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
    if (users.length === 0) return;
    
    const filtered = users.filter(
      (user) =>
        user.email !== userEmail &&
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !newRecipientEmails.some(p => p === user.email)
    );
    setFilteredUsers(filtered);
  }, [searchQuery, userEmail, users, newRecipientEmails]);

  const handleAddParticipant = (user: User) => {
    if (newRecipientEmails.length >= game.maxPlayers - 1) {
      setError(`Maximum ${game.maxPlayers} players allowed`);
      return;
    }
    setNewUsers([...newUsers,user]);
    setNewRecipientEmails([...newRecipientEmails, user.email]);
    setSearchQuery("");
    setError("");
  };

  const handleRemoveParticipant = async (email: string) => {
    if (isEditMode) {
      try {
        const invitation = await getInvitationBySlotIdAndRecipientEmail(slot.slotId,email);
        if (invitation.invitationStatus=='accepted') {
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
    setNewUsers(newUsers.filter((cu)=>cu.email!=email));
  };

  const handleSubmit = async () => {
    const isBooked=await getSlotStatus(game.gameId,slot.startTime,slot.endTime);
    if(isBooked&&!isEditMode){
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
    
      const updatedUsers = await getUsers();
      
      setUsers(updatedUsers);
      const createdAt = new Date().toISOString();
      const expiresAt = new Date(Date.parse(createdAt) + 1 * 60 * 1000).toISOString();
      if(!isEditMode)
      {
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
      else{
        
        await updateSlotPeopleAdded(slot.slotId,newRecipientEmails.length + 1);
      }
    
      if (isEditMode){
   
        const commonParticipants = findCommonParticipants(newRecipientEmails, oldRecipientEmails);
         const participantsToCancel = oldRecipientEmails.filter(participant => 
          !commonParticipants?.some(common => participant===common)
        );
       
        await updateInvitationStatus(participantsToCancel,slot.slotId,"slot cancelled",false);
        const participantsToCreate = newRecipientEmails.filter(current => 
          !commonParticipants?.some(common => current===common)
        );
      
        const newInvitations:Invitation[] = participantsToCreate.map(participant => ({
        invitationId: Math.random(),
        slotId: slot.slotId,
        senderEmail: userEmail,
        recipientEmail: participant,
        invitationStatus: "pending",
        sentAt: createdAt,
        expiresAt: expiresAt,///should be changed to slot expiration time
        isActive: true
      }));

      setInvitations(prev => [...prev, ...newInvitations]);

      await updateInvitations([...newInvitations]);
      
      }

       
      else{
          const newInvitations:Invitation[] = newRecipientEmails.map(participant => ({
            invitationId: Math.random(),
            slotId: slot.slotId,
            senderEmail: userEmail,
            recipientEmail: participant,
            invitationStatus: "pending",
            sentAt: createdAt,
            expiresAt: expiresAt,
            isActive: true
          }));

          setInvitations(prev => [...prev, ...newInvitations]);

          await updateInvitations([...invitations, ...newInvitations]);
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

        {searchQuery && filteredUsers.length > 0 && (
          <ul className="mt-2 border rounded-md max-h-40 overflow-y-auto">
            {filteredUsers.map((user) => (
              <li
                key={user.email}
                className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                onClick={() => handleAddParticipant(user)}
              >
                <span>
                  {user.name} ({user.email}) - Chances: {user.chances}
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
          <li className="p-2 bg-blue-50 rounded-md flex justify-between items-center">
            <span>You (Organizer) - Chances: {
              users.find(u => u.email === userEmail)?.chances || 0
            }</span>
          </li>
          {newUsers.map((user) => (
            <li
              key={user.email}
              className="p-2 bg-gray-50 rounded-md flex justify-between items-center"
            >
              <span>
                {user.name} ({user.email}) - Chances: {
                  users.find(u => u.email === user.email)?.chances || 0
                }
              </span>
              <button
                onClick={() => handleRemoveParticipant(user.email)}
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