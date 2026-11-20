import { apiClient } from './client';
import { MilkRecord } from '../types';

export interface AnimalMilkBreakdown {
  animalId: string;
  name: string;
  species: string;
  totalYield: number;
  avgDaily: number;
}

export interface MilkSummaryData {
  todayTotal: number;
  weekTotal: number;
  monthTotal: number;
  animalBreakdown: AnimalMilkBreakdown[];
}

export interface MilkListResponse {
  success: boolean;
  count: number;
  overallTotal: number;
  data: MilkRecord[];
}

export interface MilkFilterParams {
  range?: 'today' | 'week' | 'month' | 'custom' | 'all';
  livestockId?: string;
  startDate?: string;
  endDate?: string;
}

export const getMilkRecordsApi = async (
  params?: MilkFilterParams
): Promise<MilkListResponse> => {
  const response = await apiClient.get<MilkListResponse>('/milk', { params });
  return response.data;
};

export const getMilkSummaryApi = async (): Promise<{ success: boolean; data: MilkSummaryData }> => {
  const response = await apiClient.get<{ success: boolean; data: MilkSummaryData }>('/milk/summary');
  return response.data;
};

export const getMilkRecordByIdApi = async (
  id: string
): Promise<{ success: boolean; data: MilkRecord }> => {
  const response = await apiClient.get<{ success: boolean; data: MilkRecord }>(`/milk/${id}`);
  return response.data;
};

export const createMilkRecordApi = async (
  payload: Partial<MilkRecord>
): Promise<{ success: boolean; message: string; data: MilkRecord }> => {
  const response = await apiClient.post<{ success: boolean; message: string; data: MilkRecord }>(
    '/milk',
    payload
  );
  return response.data;
};

export const updateMilkRecordApi = async (
  id: string,
  payload: Partial<MilkRecord>
): Promise<{ success: boolean; message: string; data: MilkRecord }> => {
  const response = await apiClient.put<{ success: boolean; message: string; data: MilkRecord }>(
    `/milk/${id}`,
    payload
  );
  return response.data;
};

export const deleteMilkRecordApi = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete<{ success: boolean; message: string }>(`/milk/${id}`);
  return response.data;
};
