import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import type { Meter } from './types';

const activeMeter: Meter = {
  device_id: 'active-1',
  device_name: 'Bedroom Meter',
  device_type: 'Meter',
  hub_device_id: null,
  current_temperature: 22.4,
  current_humidity: 48,
  battery: 80,
  last_updated: new Date().toISOString(),
};
const staleMeter: Meter = {
  ...activeMeter,
  device_id: 'stale-1',
  device_name: 'Living Meter',
  last_updated: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
};

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 503 ? 'Service Unavailable' : 'OK',
    headers: new Headers(),
    json: async () => body,
    blob: async () => new Blob(),
  } as Response;
}

function installFetch(
  meters: Meter[] = [activeMeter],
  statusOverrides: Record<string, unknown> = {},
) {
  const status = {
    configured: true,
    meters_count: meters.length,
    is_rate_limited: false,
    backoff_remaining: 0,
    last_api_call: null,
    collection_interval: 120,
    ...statusOverrides,
  };
  const mockFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), 'http://localhost');
    if (url.pathname === '/api/meters' && !init?.method) {
      return jsonResponse({ meters, last_updated: null });
    }
    if (url.pathname === '/api/status') {
      return jsonResponse(status);
    }
    if (url.pathname.endsWith('/history')) {
      return jsonResponse({ history: [], device: activeMeter });
    }
    if (url.pathname === '/api/meters/refresh') {
      return jsonResponse({});
    }
    return jsonResponse({}, 404);
  });
  vi.stubGlobal('fetch', mockFetch);
  return mockFetch;
}

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
  installFetch();
});

describe('dashboard integration', () => {
  it('splits stale meters from active panels and shows the stale section', async () => {
    installFetch([activeMeter, staleMeter], { meters_count: 2 });

    render(<App />);

    expect(await screen.findByText('第1蒸留塔 (T-101)')).toBeInTheDocument();
    expect(screen.getByText('第2蒸留塔 (T-102)')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /未更新のメーター/ })).toBeInTheDocument();
    expect(screen.getByText('Monitoring 2 meters')).toBeInTheDocument();
  });

  it('shows a singular meter count and the last-refresh timestamp', async () => {
    installFetch([activeMeter], { meters_count: 1 });

    render(<App />);

    expect(await screen.findByText('Monitoring 1 meter')).toBeInTheDocument();
    expect(screen.getByText(/Last refresh: \d{2}:\d{2}:\d{2}/)).toBeInTheDocument();
  });

  it('shows the rate-limit warning text', async () => {
    installFetch([activeMeter], {
      is_rate_limited: true,
      backoff_remaining: 45,
    });

    render(<App />);

    expect(
      await screen.findByText(/SwitchBot API rate limit reached\. Retry in 45 seconds\./),
    ).toBeInTheDocument();
  });

  it('reports a meter load failure and marks the connection disconnected', async () => {
    const mockFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input), 'http://localhost');
      if (url.pathname === '/api/meters') {
        throw new Error('offline');
      }
      return jsonResponse({
        configured: true,
        meters_count: 0,
        is_rate_limited: false,
        backoff_remaining: 0,
        last_api_call: null,
        collection_interval: 120,
      });
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Failed to fetch meters: offline',
    );
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('requests history with the selected time scale', async () => {
    const mockFetch = installFetch();

    render(<App />);

    await screen.findByText('第1蒸留塔 (T-101)');
    fireEvent.change(screen.getByLabelText('Time Range:'), {
      target: { value: 'week' },
    });

    await waitFor(() => {
      expect(
        mockFetch.mock.calls.some(([input]) =>
          String(input).includes('time_scale=week'),
        ),
      ).toBe(true);
    });
  });

  it('keeps a failed refresh action error after a successful follow-up reload', async () => {
    let refreshAttempts = 0;
    const mockFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input), 'http://localhost');
      if (url.pathname === '/api/meters/refresh') {
        refreshAttempts += 1;
        return jsonResponse({}, 503);
      }
      if (url.pathname === '/api/meters') {
        return jsonResponse({ meters: [activeMeter], last_updated: null });
      }
      if (url.pathname === '/api/status') {
        return jsonResponse({
          configured: true,
          meters_count: 1,
          is_rate_limited: false,
          backoff_remaining: 0,
          last_api_call: null,
          collection_interval: 120,
        });
      }
      if (url.pathname.endsWith('/history')) {
        return jsonResponse({ history: [], device: activeMeter });
      }
      return jsonResponse({});
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<App />);

    await screen.findByText('Monitoring 1 meter');
    fireEvent.click(screen.getByRole('button', { name: 'Refresh Data' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Failed to refresh: HTTP 503 Service Unavailable',
      );
    });
    expect(refreshAttempts).toBe(1);
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });
});
