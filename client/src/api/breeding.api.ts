import { apiClient } from './client';
import { BreedingRecord } from '../types';

export interface BreedingSummary {
  total: number;
  pregnantCount: number;
  upcomingDeliveriesCount: number;
}

export interface BreedingListResponse {
  success: boolean;
  count: number;
  summary: BreedingSummary;
  data: BreedingRecord[];
}

export interface BreedingFilterParams {
  pregnancyStatus?: string;
  livestockId?: string;
  startDate?: string;
  endDate?: string;
}

export const getBreedingRecordsApi = async (
  params?: BreedingFilterParams
): Promise<BreedingListResponse> => {
  const response = await apiClient.get<BreedingListResponse>('/breeding', { params });
  return response.data;
};

export const getBreedingRecordByIdApi = async (
  id: string
): Promise<{ success: boolean; data: BreedingRecord }> => {
  const response = await apiClient.get<{ success: boolean; data: BreedingRecord }>(
    `/breeding/${id}`
  );
  return response.data;
};

export const createBreedingRecordApi = async (
  payload: Partial<BreedingRecord>
): Promise<{ success: boolean; message: string; data: BreedingRecord }> => {
  const response = await apiClient.post<{ success: boolean; message: string; data: BreedingRecord }>(
    '/breeding',
    payload
  );
  return response.data;
};

export const updateBreedingRecordApi = async (
  id: string,
  payload: Partial<BreedingRecord>
): Promise<{ success: boolean; message: string; data: BreedingRecord }> => {
  const response = await apiClient.put<{ success: boolean; message: string; data: BreedingRecord }>(
    `/breeding/${id}`,
    payload
  );
  return response.data;
};

export const deleteBreedingRecordApi = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete<{ success: boolean; message: string }>(
    `/breeding/${id}`
  );
  return response.data;
};
