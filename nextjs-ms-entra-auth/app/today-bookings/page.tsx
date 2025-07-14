"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { Slot, SlotStatus } from "../types/booking";
import { Invitation } from "../types/invitation";
import { Badge } from "../components/ui/Badge";
import { getSlotsAndInvitationsByGameId } from "../services/slotService";
import { Game } from "../types/game";
import { getGames, getGame } from "../services/gameService";
import Image from "next/image";

export default function TodayBookings() {
  const [games, setGames] = useState<Game[]>([]);
  const timeSlots = generateTimeSlots();

  const [gameId, setGameId] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("21:00");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [statusFilter, setStatusFilter] = useState<SlotStatus[]>([
  "booked",
  "on-hold",
]);

  function generateTimeSlots() {
    const slots: { from: string[]; to: string[] } = { from: [], to: [] };
    let current = new Date();
    current.setHours(9, 0, 0, 0);

    while (current.getHours() < 21) {
      const timeString = `${current.getHours().toString().padStart(2, "0")}:${current.getMinutes().toString().padStart(2, "0")}`;
      slots.from.push(timeString);
      current.setMinutes(current.getMinutes() + 30);
      slots.to.push(`${current.getHours().toString().padStart(2, "0")}:${current.getMinutes().toString().padStart(2, "0")}`);
    }
  
    slots.from.pop();
    return slots;
  }

  useEffect(() => {
    async function fetchGames() {
      try {
        const gamesData = await getGames();
        setGames(gamesData);
        if (gamesData.length > 0) {
          setGameId(gamesData[0].gameId);
        }
      } catch (err) {
        console.error("Failed to fetch games:", err);
        setError("Failed to load games. Please try again.");
      }
    }
    fetchGames();
  }, []);

  useEffect(() => {
    async function fetchGame() {
      if (!gameId) return;
      
      try {
        const gameData = await getGame(gameId);
        setGame(gameData);
      } catch (err) {
        console.error("Failed to fetch game:", err);
        setError("Failed to load game details. Please try again.");
      }
    }
    fetchGame();
  }, [gameId]);

  useEffect(() => {
    async function fetchData() {
      if (!gameId) return;
      
      setLoading(true);
      setError(null);
      try {
        const response = await getSlotsAndInvitationsByGameId(
          gameId,
          startTime,
          endTime
        );
        setSlots(response.slots);
        setInvitations(response.invitations);
      } catch (err) {
        setError("Failed to fetch bookings. Please try again.");
        console.error("Failed to fetch bookings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [gameId, startTime, endTime]);

  if (games.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Loading games...</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Loading game details...</div>
      </div>
    );
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
                  priority
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
                {game.description && (
                  <p className="text-gray-600 mt-2">{game.description}</p>
                )}
              </div>
            </div>
          </div>

          <div className="md:w-2/3">
            <h1 className="text-2xl font-bold mb-4">Today's Bookings</h1>

            <div className="flex gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Game</label>
                <select
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                >
                  {games.map((game) => (
                    <option key={game.gameId} value={game.gameId}>
                      {game.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">From</label>
                <select
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    const [startHour, startMin] = e.target.value.split(":").map(Number);
                    const [endHour, endMin] = endTime.split(":").map(Number);
                    
                    if (endHour < startHour || (endHour === startHour && endMin <= startMin)) {
                      const newEnd = new Date();
                      newEnd.setHours(startHour, startMin + 30);
                      setEndTime(`${newEnd.getHours().toString().padStart(2, "0")}:${newEnd.getMinutes().toString().padStart(2, "0")}`);
                    }
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                >
                  {timeSlots.from.map((time) => (
                    <option key={time} value={time}>
                      {formatTime(time)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">To</label>
                <select
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                >
                  {timeSlots.to
                    .filter((time) => {
                      const [startHour, startMin] = startTime.split(":").map(Number);
                      const [endHour, endMin] = time.split(":").map(Number);
                      return endHour > startHour || (endHour === startHour && endMin > startMin);
                    })
                    .map((time) => (
                      <option key={time} value={time}>
                        {formatTime(time)}
                      </option>
                    ))}
                </select>
              </div>
              
            </div>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            {loading && <p className="text-gray-500">Loading...</p>}

            {!loading && slots.length === 0 && (
              <p className="text-gray-500">No bookings found for the selected criteria.</p>
            )}
            
            {!loading && slots.length > 0 && (
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Bookings</h2>
                <div className="space-y-4">
                  {slots.map((slot) => (
                    <div key={slot.slotId} className="border rounded-md p-4">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium">
                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                          </p>
                          <p>
                            <Badge variant={getBadgeVariant(slot.slotStatus!)}>
                              {slot.slotStatus}
                            </Badge>
                          </p>
                          <p>Held by: {slot.heldBy}</p>
                        </div>
                        <div>
                          <h4 className="font-medium">Accepted Invitations:</h4>
                          {invitations
                            .filter((inv) => inv.slotId === slot.slotId)
                            .map((inv) => (
                              <p key={inv.invitationId}>
                                {inv.recipientEmail}
                              </p>
                            ))}
                          {invitations.filter((inv) => inv.slotId === slot.slotId).length === 0 && (
                            <p className="text-gray-500">No accepted invitations</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12;
  return `${formattedHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

function getBadgeVariant(status: SlotStatus): "success" | "danger" | "warning" | "default" {
  switch (status) {
    case "booked":
      return "success";
    case "slot cancelled":
    case "failed":
      return "danger";
    case "on-hold":
      return "warning";
    default:
      return "default";
  }
}