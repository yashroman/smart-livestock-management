import { apiClient } from './client';
import { HealthRecord } from '../types';

export interface HealthListResponse {
  success: boolean;
  count: number;
  data: HealthRecord[];
}

export interface HealthFilterParams {
  livestockId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export const getHealthRecordsApi = async (
  params?: HealthFilterParams
): Promise<HealthListResponse> => {
  const response = await apiClient.get<HealthListResponse>('/health-records', { params });
  return response.data;
};

export const getHealthRecordByIdApi = async (
  id: string
): Promise<{ success: boolean; data: HealthRecord }> => {
  const response = await apiClient.get<{ success: boolean; data: HealthRecord }>(
    `/health-records/${id}`
  );
  return response.data;
};

export const createHealthRecordApi = async (
  payload: Partial<HealthRecord>
): Promise<{ success: boolean; message: string; data: HealthRecord }> => {
  const response = await apiClient.post<{ success: boolean; message: string; data: HealthRecord }>(
    '/health-records',
    payload
  );
  return response.data;
};

export const updateHealthRecordApi = async (
  id: string,
  payload: Partial<HealthRecord>
): Promise<{ success: boolean; message: string; data: HealthRecord }> => {
  const response = await apiClient.put<{ success: boolean; message: string; data: HealthRecord }>(
    `/health-records/${id}`,
    payload
  );
  return response.data;
};

export const deleteHealthRecordApi = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete<{ success: boolean; message: string }>(
    `/health-records/${id}`
  );
  return response.data;
};
