import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Dashboard } from './Dashboard';

const MOCK_METERS = {
  meters: [
    {
      device_id: 'dev-001',
      device_name: 'Bedroom Meter',
      device_type: 'Meter',
      hub_device_id: null,
      current_temperature: 25.5,
      current_humidity: 60,
      battery: 85,
      last_updated: '2024-01-01T12:00:00Z',
    },
  ],
};

const MOCK_STATUS = {
  configured: true,
  meters_count: 1,
  is_rate_limited: false,
  backoff_remaining: 0,
  last_api_call: 0,
  collection_interval: 120,
};

const MOCK_HISTORY = {
  device_id: 'dev-001',
  time_scale: 'day',
  history: [],
  device: null,
};

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });

  global.fetch = vi.fn(async (url) => {
    const urlStr = typeof url === 'string' ? url : url.toString();
    if (urlStr.includes('/api/meters/') && urlStr.includes('/history')) {
      return { ok: true, json: async () => MOCK_HISTORY } as Response;
    }
    if (urlStr === '/api/meters') {
      return { ok: true, json: async () => MOCK_METERS } as Response;
    }
    if (urlStr === '/api/status') {
      return { ok: true, json: async () => MOCK_STATUS } as Response;
    }
    if (urlStr === '/api/meters/refresh') {
      return { ok: true, json: async () => ({ status: 'ok' }) } as Response;
    }
    return { ok: false, status: 404, statusText: 'Not Found' } as Response;
  }) as unknown as typeof fetch;
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('Dashboard', () => {
  it('renders title', async () => {
    render(<Dashboard />);
    expect(screen.getByText('Temp Master Dashboard')).toBeInTheDocument();
  });

  it('displays meter card after loading', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('第1蒸留塔 (T-101)')).toBeInTheDocument();
    });
  });

  it('shows temperature badge', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('25.5°C')).toBeInTheDocument();
    });
  });

  it('shows humidity badge', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('60%')).toBeInTheDocument();
    });
  });

  it('shows time scale selector with all options', async () => {
    render(<Dashboard />);
    const select = await waitFor(() => screen.getByLabelText('Time Range:'));
    expect(select).toBeInTheDocument();
    expect(select.querySelectorAll('option')).toHaveLength(5);
  });

  it('shows refresh and backup buttons', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Refresh Data')).toBeInTheDocument();
      expect(screen.getByText('Download Backup')).toBeInTheDocument();
    });
  });

  it('displays monitoring status bar', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Monitoring 1 meter')).toBeInTheDocument();
    });
  });
});
