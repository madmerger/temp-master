import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadBackup } from './api';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('downloadBackup', () => {
  it('throws the request ID from an error response without starting a download', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ request_id: 'req-123' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const createObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectURL,
    });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click');

    await expect(downloadBackup()).rejects.toThrow(
      'Failed to download backup (HTTP 500). Request ID: req-123',
    );
    expect(click).not.toHaveBeenCalled();
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it('downloads a successful response using its Content-Disposition filename', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({
        'Content-Disposition': 'attachment; filename="backup-2026.db"',
      }),
      blob: async () => new Blob(['sqlite']),
    });
    vi.stubGlobal('fetch', fetchMock);
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn().mockReturnValue('blob:test'),
    });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        expect(this.download).toBe('backup-2026.db');
        expect(this.href).toContain('blob:test');
      });
    const revoke = vi.fn();
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revoke,
    });

    await downloadBackup();

    expect(fetchMock).toHaveBeenCalledWith('/api/backup');
    expect(click).toHaveBeenCalledOnce();
    expect(revoke).toHaveBeenCalledWith('blob:test');
  });
});
