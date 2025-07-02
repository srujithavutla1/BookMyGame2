import { Slot } from "@/app/types/booking";
import SlotCard from "./SlotCard";
import { Game } from "@/app/types/game";
import { useEffect } from "react";

interface SlotsListProps {
  slots: Slot[];
  game: Game;
  onSelectSlot: (slot: Slot) => void;
  onCancelSlot: (slot: Slot) => void;
}

export default function SlotsList({ slots, game, onSelectSlot,onCancelSlot}: SlotsListProps) {
  return (
    <div className="space-y-4">
      {
        slots.map((slot) => (
          <SlotCard
            key={slot.slotId}
            slot={slot}
            game={game}
            onSelect={onSelectSlot}
            onCancel={onCancelSlot}
          />
        ))
      }
    </div>
  );
}