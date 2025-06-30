"use client";

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { Game } from '../types/game';
import { getGames } from '../services/gameService';

type GamesContextType = {
  games: Game[];
  isLoading: boolean;
  error: string | null;
};

const GamesContext = createContext<GamesContextType>({
  games: [],
  isLoading: true,
  error: null,
});

export const GamesProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<GamesContextType>({
    games: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const loadGames = async () => {
      try {
        const gamesData = await getGames();
        setState({
          games: gamesData,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to load games',
        }));
      }
    };

    loadGames();
  }, []); 

  return (
    <GamesContext.Provider value={state}>
      {children}
    </GamesContext.Provider>
  );
};

export const useGames = () => useContext(GamesContext);