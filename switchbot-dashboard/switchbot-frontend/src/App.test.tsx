import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { ThemeProvider } from './theme/ThemeProvider';

const apiMocks = vi.hoisted(() => ({
  fetchHistory: vi.fn(),
  fetchLatencyStats: vi.fn(),
  fetchMeters: vi.fn(),
  fetchStatus: vi.fn(),
  triggerRefresh: vi.fn(),
}));

vi.mock('./api/client', () => apiMocks);

const metersResponse = {
  meters: [],
  last_updated: '2026-10-13T00:00:00.000Z',
};

const statusResponse = {
  configured: true,
  meters_count: 0,
  is_rate_limited: false,
  backoff_remaining: 0,
  last_api_call: 0,
  collection_interval: 30,
};

let queryClient: QueryClient | undefined;

function renderApp() {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe('App action errors', () => {
  beforeEach(() => {
    localStorage.setItem('theme', 'light');
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: false,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList);

    apiMocks.fetchHistory.mockResolvedValue({
      device_id: '',
      time_scale: 'day',
      history: [],
      device: null,
    });
    apiMocks.fetchLatencyStats.mockResolvedValue({
      total_calls: 0,
      avg_latency_ms: null,
      min_latency_ms: null,
      max_latency_ms: null,
      successful_calls: 0,
      failed_calls: 0,
      success_rate: null,
    });
    apiMocks.fetchMeters.mockResolvedValue(metersResponse);
    apiMocks.fetchStatus.mockResolvedValue(statusResponse);
    apiMocks.triggerRefresh.mockResolvedValue(undefined);
  });

  afterEach(() => {
    queryClient?.clear();
    queryClient = undefined;
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('keeps a refresh failure visible after query refetches and dismisses it on request', async () => {
    apiMocks.triggerRefresh.mockRejectedValue(new Error('boom'));
    renderApp();

    await screen.findByText('Last refresh:', { exact: false });
    const meterCallsBeforeRefresh = apiMocks.fetchMeters.mock.calls.length;
    const statusCallsBeforeRefresh = apiMocks.fetchStatus.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Refresh Data' }));

    expect(await screen.findByText('Failed to refresh: boom')).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Refresh Data' }),
      ).toBeEnabled();
    });

    await act(async () => {
      await Promise.all([
        queryClient?.refetchQueries({ queryKey: ['meters'] }),
        queryClient?.refetchQueries({ queryKey: ['status'] }),
      ]);
    });
    await waitFor(() => {
      expect(apiMocks.fetchMeters.mock.calls.length).toBeGreaterThan(
        meterCallsBeforeRefresh,
      );
      expect(apiMocks.fetchStatus.mock.calls.length).toBeGreaterThan(
        statusCallsBeforeRefresh,
      );
    });
    expect(screen.getByText('Failed to refresh: boom')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Dismiss refresh error' }),
    );

    expect(
      screen.queryByText('Failed to refresh: boom'),
    ).not.toBeInTheDocument();
  });

  it('shows a backup HTTP error with request ID without starting a download', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({ request_id: 'abc' }),
    });
    const createObjectURL = vi.fn();
    class MockURL extends URL {}
    Object.defineProperty(MockURL, 'createObjectURL', {
      configurable: true,
      value: createObjectURL,
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('URL', MockURL);
    const anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    renderApp();

    fireEvent.click(screen.getByRole('button', { name: 'Download Backup' }));

    expect(
      await screen.findByText(
        'Failed to download backup (HTTP 500). Request ID: abc',
      ),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/backup');
    expect(anchorClick).not.toHaveBeenCalled();
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it('dismisses only the refresh error when both actions fail', async () => {
    apiMocks.triggerRefresh.mockRejectedValue(new Error('boom'));
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({ request_id: 'abc' }),
      }),
    );
    renderApp();

    fireEvent.click(screen.getByRole('button', { name: 'Refresh Data' }));
    expect(await screen.findByText('Failed to refresh: boom')).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Refresh Data' }),
      ).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Download Backup' }));
    expect(
      await screen.findByText(
        'Failed to download backup (HTTP 500). Request ID: abc',
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('alert')).toHaveLength(2);
    expect(
      screen.getByRole('button', { name: 'Dismiss backup error' }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Dismiss refresh error' }),
    );

    expect(
      screen.queryByText('Failed to refresh: boom'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('Failed to download backup (HTTP 500). Request ID: abc'),
    ).toBeInTheDocument();
  });
});
