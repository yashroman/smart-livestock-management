import { apiClient } from './client';
import { AppNotification } from '../types';

export const getNotifications = async (unreadOnly?: boolean) => {
  const response = await apiClient.get<{
    success: boolean;
    count: number;
    unreadCount: number;
    data: AppNotification[];
  }>('/notifications', {
    params: { unreadOnly: unreadOnly ? 'true' : undefined },
  });
  return response.data;
};

export const markNotificationAsRead = async (id: string) => {
  const response = await apiClient.patch<{
    success: boolean;
    message: string;
    unreadCount: number;
    data: AppNotification;
  }>(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await apiClient.patch<{
    success: boolean;
    message: string;
    unreadCount: number;
  }>('/notifications/read-all');
  return response.data;
};

export const deleteNotification = async (id: string) => {
  const response = await apiClient.delete<{
    success: boolean;
    message: string;
    unreadCount: number;
    data: { id: string };
  }>(`/notifications/${id}`);
  return response.data;
};
