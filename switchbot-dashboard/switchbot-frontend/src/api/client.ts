import type { HistoryResponse, MetersResponse, StatusResponse, TimeScale } from '../types';

// API のベース URL。未設定の場合は同一オリジン（開発時は Vite の /api プロキシ）を使用する。
export const API_URL: string = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

// 旧実装（jQuery $.ajax）のエラー引数 `err || status` に合わせたエラー文字列を持つ例外
export class ApiError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(API_URL + path, {
      ...init,
      headers: { Accept: 'application/json', ...init?.headers },
    });
  } catch {
    // ネットワークエラー時、jQuery は textStatus に 'error' を返していた
    throw new ApiError('error', null);
  }
  if (!res.ok) {
    throw new ApiError(res.statusText || 'error', res.status);
  }
  try {
    return (await res.json()) as T;
  } catch {
    throw new ApiError('parsererror', res.status);
  }
}

export function fetchMeters(): Promise<MetersResponse> {
  return requestJson<MetersResponse>('/api/meters');
}

export function fetchStatus(): Promise<StatusResponse> {
  return requestJson<StatusResponse>('/api/status');
}

export function fetchHistory(
  deviceId: string,
  timeScale: TimeScale,
  signal?: AbortSignal,
): Promise<HistoryResponse> {
  const query = new URLSearchParams({ time_scale: timeScale });
  return requestJson<HistoryResponse>(
    `/api/meters/${encodeURIComponent(deviceId)}/history?${query.toString()}`,
    { signal },
  );
}

export function triggerRefresh(): Promise<unknown> {
  return requestJson<unknown>('/api/meters/refresh', { method: 'POST' });
}

export interface BackupFile {
  blob: Blob;
  filename: string;
}

const DEFAULT_BACKUP_FILENAME = 'switchbot_backup.db';

// Content-Disposition ヘッダからファイル名を取り出す（取得できない場合は既定名）
export function parseBackupFilename(disposition: string | null): string {
  const match = (disposition ?? '').match(/filename="?([^";]+)"?/);
  return match ? match[1] : DEFAULT_BACKUP_FILENAME;
}

// バックアップは旧実装と同じく、ダッシュボードを配信しているオリジンの /api/backup から取得する
export async function downloadBackup(): Promise<BackupFile> {
  const res = await fetch('/api/backup');
  if (!res.ok) {
    let requestId: string | undefined;
    try {
      const data = (await res.json()) as { request_id?: string } | null;
      requestId = data?.request_id;
    } catch {
      requestId = undefined;
    }
    throw new ApiError(
      `Failed to download backup (HTTP ${res.status}).` +
        (requestId ? ` Request ID: ${requestId}` : ''),
      res.status,
    );
  }
  const filename = parseBackupFilename(res.headers.get('Content-Disposition'));
  return { blob: await res.blob(), filename };
}
