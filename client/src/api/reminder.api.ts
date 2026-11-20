import { apiClient } from './client';
import { Reminder, ReminderCounts } from '../types';

export interface ReminderFilterParams {
  tab?: 'all' | 'overdue' | 'today' | 'upcoming' | 'completed';
  status?: string;
  type?: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export const getReminders = async (params?: ReminderFilterParams) => {
  const response = await apiClient.get<{
    success: boolean;
    count: number;
    counts: ReminderCounts;
    data: Reminder[];
  }>('/reminders', { params });
  return response.data;
};

export const getUpcomingReminders = async () => {
  const response = await apiClient.get<{
    success: boolean;
    count: number;
    data: Reminder[];
  }>('/reminders/upcoming');
  return response.data;
};

export const getOverdueReminders = async () => {
  const response = await apiClient.get<{
    success: boolean;
    count: number;
    data: Reminder[];
  }>('/reminders/overdue');
  return response.data;
};

export const getReminderById = async (id: string) => {
  const response = await apiClient.get<{
    success: boolean;
    data: Reminder;
  }>(`/reminders/${id}`);
  return response.data;
};

export const createReminder = async (data: Partial<Reminder>) => {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
    data: Reminder;
  }>('/reminders', data);
  return response.data;
};

export const updateReminder = async (id: string, data: Partial<Reminder>) => {
  const response = await apiClient.put<{
    success: boolean;
    message: string;
    data: Reminder;
  }>(`/reminders/${id}`, data);
  return response.data;
};

export const completeReminder = async (id: string) => {
  const response = await apiClient.patch<{
    success: boolean;
    message: string;
    data: Reminder;
  }>(`/reminders/${id}/complete`);
  return response.data;
};

export const deleteReminder = async (id: string) => {
  const response = await apiClient.delete<{
    success: boolean;
    message: string;
    data: { id: string };
  }>(`/reminders/${id}`);
  return response.data;
};
