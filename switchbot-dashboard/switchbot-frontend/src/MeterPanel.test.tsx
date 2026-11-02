import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MeterPanel } from './MeterPanel';
import { ThemeProvider } from './theme';
import type { Meter } from './types';

function makeMeter(overrides: Partial<Meter> = {}): Meter {
  return {
    device_id: 'meter-1',
    device_name: 'Bedroom Meter',
    device_type: 'Meter',
    hub_device_id: null,
    current_temperature: 23.5,
    current_humidity: 45,
    battery: 90,
    last_updated: new Date().toISOString(),
    ...overrides,
  };
}

function renderPanel(meter: Meter) {
  return render(
    <ThemeProvider>
      <MeterPanel meter={meter} timeScale="day" reloadToken={0} />
    </ThemeProvider>,
  );
}

describe('MeterPanel', () => {
  it('shows the mapped name, type, readings, and chart for an active meter', () => {
    renderPanel(makeMeter());

    expect(screen.getByText('第1蒸留塔 (T-101)')).toBeInTheDocument();
    expect(screen.getByText('Meter')).toBeInTheDocument();
    expect(screen.getByText('23.5°C')).toBeInTheDocument();
    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
    expect(screen.getByTestId('chart')).toBeInTheDocument();
  });

  it('shows stale labels and explanatory text without a chart', () => {
    renderPanel(
      makeMeter({
        last_updated: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    );

    expect(screen.getByText('7日以上未更新')).toBeInTheDocument();
    expect(screen.getByText('履歴データの取得対象外')).toBeInTheDocument();
    expect(screen.queryByTestId('chart')).not.toBeInTheDocument();
  });

  it('shows the missing-data message when last_updated is null', () => {
    renderPanel(makeMeter({ last_updated: null }));

    expect(screen.getByText('値がありません（データ未受信）')).toBeInTheDocument();
  });

  it('omits the temperature label when its reading is null', () => {
    renderPanel(makeMeter({ current_temperature: null }));

    expect(screen.queryByText('23.5°C')).not.toBeInTheDocument();
    expect(screen.getByText('45%')).toBeInTheDocument();
  });
});
