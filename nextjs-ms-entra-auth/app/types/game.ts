import { Key } from "react";

// types/game.ts
export interface Game {
  _id: Key | null | undefined;
  gameId: string;
  name: string;
  minPlayers: number;
  maxPlayers: number;
  image: string;
  description?: string;
  isActive:Boolean
}