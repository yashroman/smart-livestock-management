import { apiClient } from './client';
import { DashboardStats } from '../types';

export const getDashboardStatsApi = async (): Promise<{ success: boolean; data: DashboardStats }> => {
  const response = await apiClient.get<{ success: boolean; data: DashboardStats }>('/dashboard/stats');
  return response.data;
};
