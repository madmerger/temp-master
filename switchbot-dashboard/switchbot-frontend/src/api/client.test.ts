import { afterEach, expect, it, vi } from 'vitest';
import { downloadBackup, fetchHistory, fetchMeters, fetchStatus, parseContentDisposition, refreshMeters } from './client';
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
it('parses content disposition and fallback names', () => {
 expect(parseContentDisposition('attachment; filename="backup.db"')).toBe('backup.db');
 expect(parseContentDisposition('attachment; filename=backup.db')).toBe('backup.db');
 expect(parseContentDisposition("attachment; filename*=UTF-8''hello%20world.db")).toBe('hello world.db');
 for (const value of [null, '', 'attachment', "filename*=UTF-8''%ZZ"]) expect(parseContentDisposition(value)).toBe('switchbot_backup.db');
});
it('fetches meters, status, encoded history and refresh', async () => {
 const fetch = vi.fn().mockImplementation(async () => new Response(JSON.stringify({ meters: [], history: [] })));
 vi.stubGlobal('fetch', fetch);
 expect(await fetchMeters()).toEqual({ meters: [], history: [] });
 await fetchStatus(); await fetchHistory('a/b', 'week'); await refreshMeters();
 expect(fetch.mock.calls.map(call => call[0])).toEqual(['/api/meters', '/api/status', '/api/meters/a%2Fb/history?time_scale=week', '/api/meters/refresh']);
 expect(fetch.mock.calls[3][1]).toEqual({ method: 'POST' });
});
it('rejects refresh errors before any follow-up assertions', async () => {
 const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ detail: 'Rate limited', request_id: 'abc' }), { status: 429 }));
 vi.stubGlobal('fetch', fetch);
 await expect(refreshMeters()).rejects.toThrow('HTTP 429: Rate limited Request ID: abc');
 expect(fetch).toHaveBeenCalledTimes(1);
});
it('handles non-json and network errors', async () => {
 vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('bad', { status: 500 })));
 await expect(downloadBackup()).rejects.toThrow('HTTP 500');
 vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
 await expect(fetchMeters()).rejects.toThrow('offline');
});
it('downloads the backup blob and cleans up the link', async () => {
 const blob = new Blob(['sqlite']);
 const click = vi.fn(); const remove = vi.fn();
 const anchor = { href: '', download: '', click, remove };
 const appendChild = vi.fn();
 vi.stubGlobal('document', { createElement: vi.fn().mockReturnValue(anchor), body: { appendChild } });
 const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:backup');
 const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
 const fetch = vi.fn().mockResolvedValue(new Response(blob, { headers: { 'Content-Disposition': 'attachment; filename="saved.db"' } }));
 vi.stubGlobal('fetch', fetch);
 await downloadBackup();
 expect(fetch).toHaveBeenCalledWith('/api/backup', undefined);
 expect(create.mock.calls[0][0]).toBeInstanceOf(Blob);
 expect(anchor.download).toBe('saved.db'); expect(anchor.href).toBe('blob:backup');
 expect(click).toHaveBeenCalledOnce(); expect(remove).toHaveBeenCalledOnce();
 expect(revoke).toHaveBeenCalledWith('blob:backup');
});
