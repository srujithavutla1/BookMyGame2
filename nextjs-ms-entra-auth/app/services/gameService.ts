// services/gameService.ts
import { Game } from "../types/game";
import { apiBase } from "./apiBase";

export const getGames = async (): Promise<Game[]> => {
  return apiBase.get<Game[]>('/games', {
    next: { 
      revalidate: 86400, 
      tags: ['games'] 
    }
  });
};

export const getGame = async (gameId: string): Promise<Game> => {
  return apiBase.get<Game>(`/games/${gameId}`, {
    next: { 
      revalidate: 86400,
      tags: [`game/${gameId}`] 
    }
  });
};
