import { apiClient } from './client';
import { FinanceRecord, FinanceSummary, SingleTypeSummary } from '../types';

export interface FinanceFilterParams {
  category?: string;
  range?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

// ==========================================
// INCOME API
// ==========================================

export const getIncomeRecords = async (params?: FinanceFilterParams) => {
  const response = await apiClient.get<{
    success: boolean;
    count: number;
    totalAmount: number;
    data: FinanceRecord[];
  }>('/income', { params });
  return response.data;
};

export const getIncomeSummary = async () => {
  const response = await apiClient.get<{
    success: boolean;
    data: SingleTypeSummary;
  }>('/income/summary');
  return response.data;
};

export const getIncomeById = async (id: string) => {
  const response = await apiClient.get<{
    success: boolean;
    data: FinanceRecord;
  }>(`/income/${id}`);
  return response.data;
};

export const createIncome = async (data: Partial<FinanceRecord>) => {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
    data: FinanceRecord;
  }>('/income', data);
  return response.data;
};

export const updateIncome = async (id: string, data: Partial<FinanceRecord>) => {
  const response = await apiClient.put<{
    success: boolean;
    message: string;
    data: FinanceRecord;
  }>(`/income/${id}`, data);
  return response.data;
};

export const deleteIncome = async (id: string) => {
  const response = await apiClient.delete<{
    success: boolean;
    message: string;
    data: { id: string };
  }>(`/income/${id}`);
  return response.data;
};

// ==========================================
// EXPENSE API
// ==========================================

export const getExpenseRecords = async (params?: FinanceFilterParams) => {
  const response = await apiClient.get<{
    success: boolean;
    count: number;
    totalAmount: number;
    data: FinanceRecord[];
  }>('/expenses', { params });
  return response.data;
};

export const getExpenseSummary = async () => {
  const response = await apiClient.get<{
    success: boolean;
    data: SingleTypeSummary;
  }>('/expenses/summary');
  return response.data;
};

export const getExpenseById = async (id: string) => {
  const response = await apiClient.get<{
    success: boolean;
    data: FinanceRecord;
  }>(`/expenses/${id}`);
  return response.data;
};

export const createExpense = async (data: Partial<FinanceRecord>) => {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
    data: FinanceRecord;
  }>('/expenses', data);
  return response.data;
};

export const updateExpense = async (id: string, data: Partial<FinanceRecord>) => {
  const response = await apiClient.put<{
    success: boolean;
    message: string;
    data: FinanceRecord;
  }>(`/expenses/${id}`, data);
  return response.data;
};

export const deleteExpense = async (id: string) => {
  const response = await apiClient.delete<{
    success: boolean;
    message: string;
    data: { id: string };
  }>(`/expenses/${id}`);
  return response.data;
};

// ==========================================
// AUTHORITATIVE FINANCE SUMMARY API
// Net Income = Total Income - Total Expenses
// ==========================================

export const getFinanceSummary = async (from?: string, to?: string) => {
  const response = await apiClient.get<{
    success: boolean;
    data: FinanceSummary;
  }>('/finance/summary', {
    params: { from, to },
  });
  return response.data;
};
