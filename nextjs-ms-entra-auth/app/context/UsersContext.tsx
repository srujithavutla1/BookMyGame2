"use client";

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { User } from '../types/user';
import { getUserByEmail } from '../services/userService';
import { useAuth } from './AuthContext';

type UsersContextType = {
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
};

const UsersContext = createContext<UsersContextType>({
  currentUser: null,
  isLoading: false,
  error: null,
});

export const UsersProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserByEmail = async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const userData = await getUserByEmail(email);
      setCurrentUser(userData);
    } catch (err) {
      setError('Failed to load user');
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchUserByEmail(user.email);
    }
  }, [user?.email]);

  return (
    <UsersContext.Provider value={{ currentUser, isLoading, error}}>
      {children}
    </UsersContext.Provider>
  );
};

export const useUsers = () => useContext(UsersContext);