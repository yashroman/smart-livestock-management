import { apiClient } from './client';
import { FeedRecord, FeedSummary } from '../types';

export interface FeedFilterParams {
  livestockId?: string;
  feedType?: string;
  range?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  group?: string;
}

export const getFeedRecords = async (params?: FeedFilterParams) => {
  const response = await apiClient.get<{
    success: boolean;
    count: number;
    totalQuantity: number;
    totalCost: number;
    data: FeedRecord[];
  }>('/feed', { params });
  return response.data;
};

export const getFeedSummary = async () => {
  const response = await apiClient.get<{
    success: boolean;
    data: FeedSummary;
  }>('/feed/summary');
  return response.data;
};

export const getFeedRecordById = async (id: string) => {
  const response = await apiClient.get<{
    success: boolean;
    data: FeedRecord;
  }>(`/feed/${id}`);
  return response.data;
};

export const createFeedRecord = async (data: Partial<FeedRecord>) => {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
    data: FeedRecord;
  }>('/feed', data);
  return response.data;
};

export const updateFeedRecord = async (id: string, data: Partial<FeedRecord>) => {
  const response = await apiClient.put<{
    success: boolean;
    message: string;
    data: FeedRecord;
  }>(`/feed/${id}`, data);
  return response.data;
};

export const deleteFeedRecord = async (id: string) => {
  const response = await apiClient.delete<{
    success: boolean;
    message: string;
    data: { id: string };
  }>(`/feed/${id}`);
  return response.data;
};
