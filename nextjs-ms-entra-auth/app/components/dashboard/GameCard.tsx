"use client";
import { Game } from "@/app/types/game";
import Image from "next/image";
import Link from "next/link";

interface GameCardProps {
  game: Game;
  isDisabled: boolean;
}

export default function GameCard({ game, isDisabled }: GameCardProps) {
  const cardContent = (
    <div>
      <div className="relative h-64">
        <Image
          src={game.image}
          alt={game.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-3 space-y-1">
        <h3 className="text-lg font-semibold text-gray-800">{game.name}</h3>
        <p className="text-sm text-gray-600"> 
          Players: {game.minPlayers}-{game.maxPlayers}
        </p>
        <div className="pt-2 flex justify-between items-center"> 
          <span className="text-xs text-gray-500"> 
            {isDisabled ? "Available after 9:00 AM IST" : "Book now until 9:00 PM IST"}
          </span>
          <button 
            className={`px-3 py-1.5 text-sm text-white rounded-md ${
              isDisabled 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-blue-600 hover:bg-blue-700 transition-colors"
            }`}
            disabled={isDisabled}
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${
      isDisabled 
        ? 'opacity-70' 
        : 'hover:shadow-lg transition-shadow duration-300 cursor-pointer'
    }`}>
      {isDisabled ? cardContent : <Link href={`/games/${game.gameId}`}>{cardContent}</Link>}
    </div>
  );
}