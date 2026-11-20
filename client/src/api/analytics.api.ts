import { apiClient } from './client';
import {
  AnalyticsOverview,
  LivestockAnalytics,
  MilkAnalytics,
  VaccinationAnalytics,
  HealthAnalytics,
  BreedingAnalytics,
  FeedAnalytics,
  FinanceAnalytics,
} from '../types';

export interface DateFilterParams {
  from?: string;
  to?: string;
  range?: '7d' | '30d' | 'all' | 'custom';
}

export const getAnalyticsOverviewApi = async () => {
  const response = await apiClient.get<{
    success: boolean;
    data: AnalyticsOverview;
  }>('/analytics/overview');
  return response.data;
};

export const getLivestockAnalyticsApi = async () => {
  const response = await apiClient.get<{
    success: boolean;
    data: LivestockAnalytics;
  }>('/analytics/livestock');
  return response.data;
};

export const getMilkAnalyticsApi = async (params?: DateFilterParams) => {
  const response = await apiClient.get<{
    success: boolean;
    data: MilkAnalytics;
  }>('/analytics/milk', { params });
  return response.data;
};

export const getHealthAnalyticsApi = async () => {
  const response = await apiClient.get<{
    success: boolean;
    data: HealthAnalytics;
  }>('/analytics/health');
  return response.data;
};

export const getVaccinationAnalyticsApi = async () => {
  const response = await apiClient.get<{
    success: boolean;
    data: VaccinationAnalytics;
  }>('/analytics/vaccinations');
  return response.data;
};

export const getBreedingAnalyticsApi = async () => {
  const response = await apiClient.get<{
    success: boolean;
    data: BreedingAnalytics;
  }>('/analytics/breeding');
  return response.data;
};

export const getFeedAnalyticsApi = async (params?: DateFilterParams) => {
  const response = await apiClient.get<{
    success: boolean;
    data: FeedAnalytics;
  }>('/analytics/feed', { params });
  return response.data;
};

export const getFinanceAnalyticsApi = async (params?: DateFilterParams) => {
  const response = await apiClient.get<{
    success: boolean;
    data: FinanceAnalytics;
  }>('/analytics/finance', { params });
  return response.data;
};

export const downloadModuleCsvApi = async (
  moduleName: string,
  params?: { from?: string; to?: string }
) => {
  const response = await apiClient.get(`/reports/${moduleName}/csv`, {
    params,
    responseType: 'blob',
  });

  // Create temporary link and trigger download in browser
  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${moduleName}-report.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
