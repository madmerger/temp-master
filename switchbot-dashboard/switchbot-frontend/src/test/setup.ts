import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

vi.mock('react-chartjs-2', async () => {
  const React = await import('react');
  return {
    Line: ({
      data,
    }: {
      data: { datasets: Array<{ data: number[] }> };
    }) =>
      React.createElement('div', {
        'data-testid': 'chart',
        'data-points': JSON.stringify(data.datasets[0]?.data ?? []),
      }),
  };
});
