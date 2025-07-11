// app/games/[gameid]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CreateSlot, Slot, SlotStatus } from "@/app/types/booking";
import { generateTimeSlots } from "@/app/utils/date";
import Image from "next/image";
import SlotsList from "@/app/components/booking/SlotList";
import BookingForm from "@/app/components/booking/BookingForm";
import { Game } from "@/app/types/game";
import { getInvitationsBySlotId, updateInvitations } from "@/app/services/invitationService";
import { getUserByEmail, getUsers, updateUserChances, updateUsers } from "@/app/services/userService";
import { User } from "@/app/types/user";
import { Invitation, InvitationStatus } from "@/app/types/invitation";
import { updateSlots, updateSlotStatus } from "@/app/services/slotService";
import { getGame } from "@/app/services/gameService";
import { useAuth } from "@/app/context/AuthContext";
import { v4 as uuidv4 } from 'uuid';


export default function GamePage() {

  const { gameId } = useParams();
  const { user } = useAuth();
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [game, setGame] = useState<Game | null>(null);
  const [error, setError] = useState<string | null>(null);


  const fetchGame = async () => {
    try {
      if (!gameId) return;
      setIsLoading(true);
      const gameData = await getGame(gameId as string);
      setGame(gameData);
    } catch (err) {
      console.error("Failed to fetch game:", err);
      setError("Failed to load game");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSlots = async () => {
    try {
      setIsLoading(true);
      const generatedSlots = await generateTimeSlots(
        gameId as string,
        user?.email!
      );
      setSlots(generatedSlots);
      return generatedSlots;
    } catch (error) {
      console.error("Failed to fetch slots:", error);
      setError("Failed to load slots");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (gameId) {
      fetchGame();
      if (user?.email) {
        fetchSlots();
      }
    }
  }, [gameId, user?.email]);

  useEffect(() => {
    const eventSourceOptions = { withCredentials: true };

    //when confirmbooking, to get on-hold on all other slots
    const eventSource1 = new EventSource(`http://localhost:3001/events/slots/created?gameId=${gameId}`, eventSourceOptions);
    eventSource1.onmessage = (event) => {
      const updatedSlot = JSON.parse(event.data);
      if (updatedSlot.gameId !== gameId) {
        console.log("gameId not matched");
        return;
      }
      setSelectedSlot(prev => {
        return null;
      });
      setSlots(prevSlots => {
        const slotIndex = prevSlots.findIndex(s => s.startTime === updatedSlot.startTime && s.endTime === updatedSlot.endTime);
        if (slotIndex === -1) {
          return prevSlots;
        }

        const newSlots = [...prevSlots];
        newSlots[slotIndex] = updatedSlot;
        return newSlots;
      });

    }
    //when slot is cancelled, on-hold badge should be removed in other accounts automatically
    const eventSource2 = new EventSource(`http://localhost:3001/events/slots/StatusUpdated?gameId=${gameId}`, eventSourceOptions);
    eventSource2.onmessage = (event) => {
      console.log("status updated");
      const updatedSlot = JSON.parse(event.data);
      if (updatedSlot.gameId !== gameId) {
        console.log("gameId not matched");
        return;
      }
      setSelectedSlot(prev => {
        return null;
      });
      setSlots(prevSlots => {
        const slotIndex = prevSlots.findIndex(s => s.startTime === updatedSlot.startTime && s.endTime === updatedSlot.endTime);
        if (slotIndex === -1) {
          return prevSlots;
        }
        const newSlots = [...prevSlots];
        newSlots[slotIndex] = updatedSlot;
        return newSlots;
      });

    }

    //when expired to get booked/failed

    const eventSource = new EventSource(`http://localhost:3001/events/slots/expired?gameId=${gameId}`, eventSourceOptions);

    eventSource.onmessage = (event) => {
      console.log("expired event occured");
      const updatedSlot = JSON.parse(event.data);
      if (updatedSlot.gameId !== gameId) {
        console.log("gameId not matched");
        return
      };
      console.log(updatedSlot);
      setSlots(prevSlots => {
        const slotIndex = prevSlots.findIndex(s => s.startTime === updatedSlot.startTime && s.endTime === updatedSlot.endTime);

        if (slotIndex === -1) {
          return prevSlots;
        }
        setSelectedSlot(prev => {
          return null;
        });
        const newSlots = [...prevSlots];
        if (updatedSlot.slotStatus === 'booked' as SlotStatus) {
          newSlots[slotIndex] = updatedSlot;
        } else {
          newSlots[slotIndex] = {
            slotId: uuidv4(),
            gameId: updatedSlot.gameId,
            startTime: updatedSlot.startTime,
            endTime: updatedSlot.endTime,
            heldBy: updatedSlot.heldBy,
          };
        }
        return newSlots;
      });
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [gameId]);


  const handleCancelSlot = async (slot: Slot) => {
    try {

      const updatedSlot = await updateSlotStatus(slot.slotId, "slot cancelled", false);

      const [invitations, users] = await Promise.all([
        getInvitationsBySlotId(slot.slotId!),
        getUsers()
      ]);


      const usersToUpdate: string[] = [];
      usersToUpdate.push(user!.email!);

      const updatedInvitations = invitations.map((inv: Invitation) => {
        if (inv.invitationStatus === 'accepted') {
          let recipient = users.find((u: User) => u.email === inv.recipientEmail)!;
          usersToUpdate.push(recipient.email);
          return {
            ...inv,
            invitationStatus: "slot cancelled" as InvitationStatus,
            isActive: false,
          };
        } else {
          return {
            ...inv,
            invitationStatus: "slot cancelled" as InvitationStatus,
            isActive: false,
          };
        }
      });

      await Promise.all([
        updateInvitations(updatedInvitations),
        updateUserChances(usersToUpdate, -1),

      ]);

      const newSlotId = uuidv4();

      const newSlot: Slot = {
        slotId: newSlotId,
        gameId: slot.gameId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        heldBy: slot.heldBy
      }

      setSlots(prevSlots => prevSlots.map(s =>
        s.slotId === slot.slotId ? newSlot : s
      ));


    } catch (error) {
      console.error('Failed to cancel slot:', error);
      setError("Failed to cancel slot");
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div>Loading game...</div>
    </div>;
  }

  if (error) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div>{error}</div>
    </div>;
  }

  if (!game) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div>Game not found</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/3">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="relative h-64">
                <Image
                  src={game.image}
                  alt={game.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h1 className="text-2xl font-bold text-gray-800">
                  {game.name}
                </h1>
                <p className="text-gray-600 mt-2">
                  Players: {game.minPlayers}-{game.maxPlayers}
                </p>
                <p className="text-gray-600 mt-2">
                  Duration: 30 minutes per slot
                </p>
              </div>
            </div>
          </div>

          <div className="md:w-2/3 ">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Available Slots for Today
            </h2>
            {isLoading ? (
              <div>Loading slots...</div>
            ) : (
              <SlotsList
                slots={slots}
                game={game}
                onSelectSlot={setSelectedSlot}
                onCancelSlot={handleCancelSlot}
              />
            )}
          </div>
        </div>

        {selectedSlot && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <BookingForm
                slot={selectedSlot}
                game={game}
                userEmail={user?.email!}
                onClose={() => setSelectedSlot(null)}
                onSuccess={fetchSlots}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}