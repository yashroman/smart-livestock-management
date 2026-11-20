import { apiClient } from './client';
import { Vaccination } from '../types';

export interface VaccinationSummary {
  total: number;
  completed: number;
  dueSoon: number;
  overdue: number;
}

export interface VaccinationListResponse {
  success: boolean;
  count: number;
  summary: VaccinationSummary;
  data: Vaccination[];
}

export interface VaccinationFilterParams {
  status?: string;
  livestockId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export const getVaccinationsApi = async (
  params?: VaccinationFilterParams
): Promise<VaccinationListResponse> => {
  const response = await apiClient.get<VaccinationListResponse>('/vaccinations', { params });
  return response.data;
};

export const getVaccinationByIdApi = async (
  id: string
): Promise<{ success: boolean; data: Vaccination }> => {
  const response = await apiClient.get<{ success: boolean; data: Vaccination }>(
    `/vaccinations/${id}`
  );
  return response.data;
};

export const createVaccinationApi = async (
  payload: Partial<Vaccination>
): Promise<{ success: boolean; message: string; data: Vaccination }> => {
  const response = await apiClient.post<{ success: boolean; message: string; data: Vaccination }>(
    '/vaccinations',
    payload
  );
  return response.data;
};

export const updateVaccinationApi = async (
  id: string,
  payload: Partial<Vaccination>
): Promise<{ success: boolean; message: string; data: Vaccination }> => {
  const response = await apiClient.put<{ success: boolean; message: string; data: Vaccination }>(
    `/vaccinations/${id}`,
    payload
  );
  return response.data;
};

export const deleteVaccinationApi = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete<{ success: boolean; message: string }>(
    `/vaccinations/${id}`
  );
  return response.data;
};
