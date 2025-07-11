import { Slot } from "@/app/types/booking";
import SlotCard from "./SlotCard";
import { Game } from "@/app/types/game";

interface SlotsListProps {
  slots: Slot[];
  game: Game;
  onSelectSlot: (slot: Slot) => void;
  onCancelSlot: (slot: Slot) => void;
}

export default function SlotsList({ slots, game, onSelectSlot, onCancelSlot }: SlotsListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {slots.map((slot) => (
        <SlotCard
          key={slot.slotId}
          slot={slot}
          game={game}
          onSelect={onSelectSlot}
          onCancel={onCancelSlot}
        />
      ))}
    </div>
  );
}