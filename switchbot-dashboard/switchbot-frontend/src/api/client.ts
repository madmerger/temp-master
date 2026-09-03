import { API_URL } from '../config';
import type { HistoryResponse, MetersResponse, StatusResponse, TimeScale } from '../types';

const request = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
};

export const fetchMeters = async (): Promise<MetersResponse> =>
  request<MetersResponse>(`${API_URL}/api/meters`);

export const fetchStatus = async (): Promise<StatusResponse> =>
  request<StatusResponse>(`${API_URL}/api/status`);

export const fetchHistory = async (deviceId: string, timeScale: TimeScale): Promise<HistoryResponse> =>
  request<HistoryResponse>(
    `${API_URL}/api/meters/${encodeURIComponent(deviceId)}/history?time_scale=${timeScale}`,
  );

export const triggerRefresh = async (): Promise<unknown> =>
  request<unknown>(`${API_URL}/api/meters/refresh`, { method: 'POST' });

export const backupUrl = `${API_URL}/api/backup`;
