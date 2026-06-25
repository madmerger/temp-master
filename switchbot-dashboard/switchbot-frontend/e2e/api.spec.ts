import { test, expect } from '@playwright/test';

const API_URL = process.env.VITE_API_URL || 'https://temp-master.fly.dev';

test.describe('API smoke tests', () => {
  test('GET /api/meters returns meter list', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/meters`);
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(body).toHaveProperty('meters');
    expect(Array.isArray(body.meters)).toBe(true);
    expect(body.meters.length).toBeGreaterThan(0);

    const meter = body.meters[0];
    expect(meter).toHaveProperty('device_id');
    expect(meter).toHaveProperty('device_name');
    expect(meter).toHaveProperty('device_type');
  });

  test('GET /api/status returns system status', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/status`);
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(body).toHaveProperty('configured');
    expect(body).toHaveProperty('meters_count');
    expect(body).toHaveProperty('is_rate_limited');
    expect(typeof body.meters_count).toBe('number');
  });

  test('GET /api/meters/:id/history returns history data', async ({ request }) => {
    const metersRes = await request.get(`${API_URL}/api/meters`);
    const { meters } = await metersRes.json();
    expect(meters.length).toBeGreaterThan(0);

    const deviceId = meters[0].device_id;
    const histRes = await request.get(
      `${API_URL}/api/meters/${encodeURIComponent(deviceId)}/history?time_scale=day`,
    );
    expect(histRes.ok()).toBeTruthy();

    const histBody = await histRes.json();
    expect(histBody).toHaveProperty('device_id', deviceId);
    expect(histBody).toHaveProperty('history');
    expect(Array.isArray(histBody.history)).toBe(true);
  });

  test('POST /api/meters/refresh triggers data collection', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/meters/refresh`);
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(body).toHaveProperty('status', 'ok');
    expect(body).toHaveProperty('meters_count');
  });

  test('GET /api/backup returns a database file', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/backup`);
    expect(res.ok()).toBeTruthy();

    const contentType = res.headers()['content-type'] || '';
    expect(
      contentType.includes('sqlite') || contentType.includes('octet-stream'),
    ).toBeTruthy();
  });
});
