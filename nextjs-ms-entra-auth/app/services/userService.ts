// services/userService.ts
import { User } from "../types/user";
import { apiBase } from "./apiBase";

export const getUsers = async (): Promise<User[]> => {
  return apiBase.get<User[]>('/users');
};

export const getUserByEmail = async (email: string): Promise<User> => {
  return apiBase.get<User>(`/users?email=${encodeURIComponent(email)}`);
};



export const updateUsers = async (users: User[]): Promise<void> => {
  await apiBase.put<void>('/users', users);
};

export const updateUserChances = async (emails: string[], chances: number): Promise<void> => {
  await apiBase.patch<void>('/users/updateChances', {
    emails,
    chances
  });
};