import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

vi.mock('./TemperatureChart', () => ({
  default: () => <div data-testid="temperature-chart" />,
}));

const freshDate = new Date().toISOString();
const staleDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();

const meters = {
  meters: [
    {
      device_id: 'active-1',
      device_name: 'Bedroom Meter',
      device_type: 'Meter',
      current_temperature: 21.5,
      current_humidity: 45,
      battery: 90,
      last_updated: freshDate,
    },
    {
      device_id: 'stale-1',
      device_name: 'Living Meter',
      device_type: 'Meter',
      current_temperature: 19,
      current_humidity: 50,
      battery: 70,
      last_updated: staleDate,
    },
  ],
};

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/api/meters')) {
          return Promise.resolve(
            new Response(JSON.stringify(meters), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }),
          );
        }
        if (url.endsWith('/api/status')) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                meters_count: meters.meters.length,
                is_rate_limited: false,
                backoff_remaining: 0,
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } },
            ),
          );
        }
        if (url.includes('/history?')) {
          return Promise.resolve(
            new Response(JSON.stringify({ history: [] }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }),
          );
        }
        return Promise.reject(new Error(`Unexpected request: ${url}`));
      }),
    );
  });

  it('renders mapped meter names, the stale section, and connection status', async () => {
    render(<App />);

    expect(await screen.findByText('第1蒸留塔 (T-101)')).toBeTruthy();
    expect(screen.getByText('⚠ 未更新のメーター')).toBeTruthy();
    expect(screen.getByText('第2蒸留塔 (T-102)')).toBeTruthy();
    expect(screen.getByText('Connected')).toBeTruthy();
  });
});
