export interface ChartColors {
  grid: string;
  tick: string;
  tooltip: {
    background: string;
    title: string;
    body: string;
    border: string;
  };
  line: string;
  fill: string;
  pointHoverBackground: string;
}

export function getChartColors(isDark: boolean): ChartColors {
  return isDark
    ? {
        grid: 'rgba(255,255,255,0.08)',
        tick: '#9ca3af',
        tooltip: {
          background: '#1f2937',
          title: '#f3f4f6',
          body: '#f3f4f6',
          border: 'rgba(255,255,255,0.15)',
        },
        line: '#d9534f',
        fill: 'rgba(217,83,79,0.15)',
        pointHoverBackground: '#5bc0de',
      }
    : {
        grid: 'rgba(0,0,0,0.05)',
        tick: '#777',
        tooltip: {
          background: '#ffffff',
          title: '#333333',
          body: '#333333',
          border: 'rgba(0,0,0,0.12)',
        },
        line: '#d9534f',
        fill: 'rgba(217,83,79,0.15)',
        pointHoverBackground: '#5bc0de',
      };
}
