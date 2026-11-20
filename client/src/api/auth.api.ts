import { apiClient } from './client';
import { User, SupportedLanguage } from '../types';

export interface RegisterPayload {
  fullName: string;
  mobile: string;
  email: string;
  password: string;
  farmName: string;
  location: string;
  preferredLanguage?: SupportedLanguage;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

export const registerApi = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/register', payload);
  return response.data;
};

export const loginApi = async (payload: LoginPayload): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/login', payload);
  return response.data;
};

export const getMeApi = async (): Promise<{ success: boolean; user: User }> => {
  const response = await apiClient.get<{ success: boolean; user: User }>('/auth/me');
  return response.data;
};

export const logoutApi = async (): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post<{ success: boolean; message: string }>('/auth/logout');
  return response.data;
};
