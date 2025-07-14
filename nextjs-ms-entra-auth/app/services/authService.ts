import { apiBase } from "./apiBase";

export type UserProfile = {
  userId: string;
  email: string;
};

export type LoginResponse = {
  success: boolean;
  message?: string;
};

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
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

export const refreshAccessToken = async (refreshToken: string): Promise<TokenResponse> => {
  try {
    const response = await apiBase.post<TokenResponse>('/auth/refresh', { refresh_token: refreshToken });
    return response;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to refresh token');
  }
};