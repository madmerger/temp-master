import { beforeEach, describe, expect, it, vi } from 'vitest';
import { API_URL } from './config';
import { downloadBackup, fetchMeters, fetchStatus } from './api';

describe('API client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('builds meters and status URLs from API_URL', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ meters: [] }),
    } as Response);

    await fetchMeters();
    await fetchStatus();

    expect(fetch).toHaveBeenNthCalledWith(1, `${API_URL}/api/meters`, {
      signal: undefined,
    });
    expect(fetch).toHaveBeenNthCalledWith(2, `${API_URL}/api/status`, {
      signal: undefined,
    });
  });

  it('keeps backup errors from downloading a blob and includes the request ID', async () => {
    const createObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL: vi.fn() });
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ request_id: 'req-123' }),
    } as Response);

    await expect(downloadBackup()).rejects.toThrow(
      'Failed to download backup (HTTP 500). Request ID: req-123',
    );
    expect(fetch).toHaveBeenCalledWith('/api/backup');
    expect(createObjectURL).not.toHaveBeenCalled();
  });
});
