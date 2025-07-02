// services/authService.ts
import { apiBase } from "./apiBase";

export type UserProfile = {
  userId: string;
  email: string;
};

export type LoginResponse = {
  success: boolean;
  message?: string;
};

export const getProfile = async (): Promise<UserProfile> => {
  return apiBase.get<UserProfile>('/auth/profile');
};

export const loginWithMicrosoft = async (): Promise<void> => {
  window.location.href = 'http://localhost:3001/auth/microsoft';
};

export const loginWithEmailPassword = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await apiBase.post<LoginResponse>('/auth/login', { email, password });
    return response;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'An error occurred during login'
    };
  }
};

export const logout = async (): Promise<{ success: boolean }> => {
  return apiBase.get<{ success: boolean }>('/auth/logout');
};

export const checkAuth = async (): Promise<boolean> => {
  try {
    await getProfile();
    return true;
  } catch (error) {
    return false;
  }
};

export const hasPassword = async (): Promise<boolean> => {
  try {
    const response = await apiBase.get<{ hasPassword: boolean }>('/auth/has-password');
    return response.hasPassword;
  } catch (error) {
    console.error('Error checking password status:', error);
    return false;
  }
};

export const setUserPassword = async (password: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await apiBase.post<{ success: boolean }>('/auth/set-password', { password });
    return response;
  } catch (error: any) {
    return { 
      success: false, 
      message: error.message || 'Failed to set password' 
    };
  }
};