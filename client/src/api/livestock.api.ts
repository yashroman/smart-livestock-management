import { apiClient } from './client';
import { Livestock, HealthRecord, Vaccination, BreedingRecord, MilkRecord } from '../types';

export interface LivestockListResponse {
  success: boolean;
  count: number;
  data: Livestock[];
}

export interface LivestockDetailData extends Livestock {
  recentHealth: HealthRecord[];
  recentVaccinations: Vaccination[];
  recentBreeding: BreedingRecord[];
  recentMilk: MilkRecord[];
}

export interface LivestockDetailResponse {
  success: boolean;
  data: LivestockDetailData;
}

export interface LivestockFilterParams {
  search?: string;
  species?: string;
  status?: string;
  gender?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const getLivestockListApi = async (
  params?: LivestockFilterParams
): Promise<LivestockListResponse> => {
  const response = await apiClient.get<LivestockListResponse>('/livestock', { params });
  return response.data;
};

export const getLivestock = getLivestockListApi;

export const getLivestockByIdApi = async (id: string): Promise<LivestockDetailResponse> => {
  const response = await apiClient.get<LivestockDetailResponse>(`/livestock/${id}`);
  return response.data;
};

export const createLivestockApi = async (
  payload: Partial<Livestock>
): Promise<{ success: boolean; message: string; data: Livestock }> => {
  const response = await apiClient.post<{ success: boolean; message: string; data: Livestock }>(
    '/livestock',
    payload
  );
  return response.data;
};

export const updateLivestockApi = async (
  id: string,
  payload: Partial<Livestock>
): Promise<{ success: boolean; message: string; data: Livestock }> => {
  const response = await apiClient.put<{ success: boolean; message: string; data: Livestock }>(
    `/livestock/${id}`,
    payload
  );
  return response.data;
};

export const deleteLivestockApi = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete<{ success: boolean; message: string }>(
    `/livestock/${id}`
  );
  return response.data;
};
