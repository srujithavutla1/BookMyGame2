// services/authService.ts
import { apiBase } from "./apiBase";

export type UserProfile = {
  userId: string;
  email: string;
  // Add any other user properties you expect from the backend
};

export const authService = {
  /**
   * Fetches the current user's profile
   */
  getProfile: async (): Promise<UserProfile> => {
    return apiBase.get<UserProfile>('/auth/profile');
  },

  /**
   * Initiates the Microsoft login flow (redirects to backend)
   */
  loginWithMicrosoft: async (): Promise<void> => {
    // Note: This will redirect to the backend's OAuth endpoint
    window.location.href = 'http://localhost:3001/auth/microsoft';
  },

  /**
   * Logs out the current user
   */
  logout: async (): Promise<{ success: boolean }> => {
    return apiBase.get<{ success: boolean }>('/auth/logout');
  },

  /**
   * Checks if the user is authenticated by attempting to fetch their profile
   */
  checkAuth: async (): Promise<boolean> => {
    try {
      await authService.getProfile();
      return true;
    } catch (error) {
      return false;
    }
  }
};