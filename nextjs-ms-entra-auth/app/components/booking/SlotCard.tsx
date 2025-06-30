"use client";


import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Slot, SlotStatus } from "@/app/types/booking";
import { Game } from "@/app/types/game";
import { calculateSlotStatus, isWithinAllowedHours } from "@/app/utils/date";
import { useEffect, useState } from "react";
import { useUsers } from "@/app/context/UsersContext";
import { useAuth } from "@/app/context/AuthContext";

interface SlotCardProps {
  slot: Slot;
  game: Game;
  onSelect: (slot: Slot) => void;
  onCancel: (slot: Slot) => void;
}

export default function SlotCard({ slot, game, onSelect, onCancel }: SlotCardProps) {
    const { user, isLoading } = useAuth();
  
  const { currentUser } = useUsers(); 
  const [isCancelling, setIsCancelling] = useState(false);
  const [isAllowedTime, setIsAllowedTime] = useState(false);
 // console.log(slot);
  
  useEffect(() => {
  
    setIsAllowedTime(isWithinAllowedHours());
  }, []);

  const status = calculateSlotStatus(slot, user?.email!);
  
  const isDisabled = currentUser?.chances === 0 && status === "available" || !isAllowedTime;

  const handleCancel = async (slot: Slot) => {
    setIsCancelling(true);
    try {
      await onCancel(slot);
    } catch (error) {
      console.error('Failed to cancel slot:', error);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow p-4 flex justify-between items-center relative ${
        isDisabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      <div>
        <h3 className="font-medium text-gray-800">
          {slot.startTime} - {slot.endTime}
        </h3>
        {status === "booked" && (
          <Badge variant="danger" className="mt-1">
            Booked
          </Badge>
        )}
        {status === "booked-by-you" as SlotStatus && (
          <Badge variant="success" className="mt-1">
            Your Booking
          </Badge>
        )}
        {status === "on-hold" && (
          <Badge variant="warning" className="mt-1">
            On Hold
          </Badge>
        )}
        {!isAllowedTime && (
          <p className="text-xs text-yellow-600 mt-1">
            Booking available only between 9 AM - 9 PM IST
          </p>
        )}
      </div>

      <div className="relative">
        {status === "available" ? (
          <Button
          variant="primary"
            onClick={() => onSelect(slot)}
            disabled={isDisabled}
            className={isDisabled ? 'cursor-not-allowed' : ''}
          >
            {isAllowedTime ? 'Book Slot' : 'Not Available'}
          </Button>
        ) : status === "on-hold-by-you" as SlotStatus ? (
          <>
            <Button
              variant="danger"
              onClick={() => handleCancel(slot)}
              disabled={isCancelling || !isAllowedTime}
              isLoading={isCancelling}
            >
              Cancel
            </Button>
            
            <Button 
              variant="primary" 
              onClick={() => onSelect(slot)}
              disabled={!isAllowedTime}
            >
              Edit
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}