/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: 'rgb(var(--color-surface-rgb) / <alpha-value>)',
        'surface-raised': 'rgb(var(--color-surface-raised-rgb) / <alpha-value>)',
        ink: 'rgb(var(--color-ink-rgb) / <alpha-value>)',
        muted: 'rgb(var(--color-muted-rgb) / <alpha-value>)',
        accent: 'rgb(var(--color-accent-rgb) / <alpha-value>)',
        border: 'rgb(var(--color-border-rgb) / <alpha-value>)',
        header: 'rgb(var(--color-header-rgb) / <alpha-value>)',
        warning: 'rgb(var(--color-warning-rgb) / <alpha-value>)',
        'warning-ink': 'rgb(var(--color-warning-ink-rgb) / <alpha-value>)',
        danger: 'rgb(var(--color-danger-rgb) / <alpha-value>)',
        success: 'rgb(var(--color-success-rgb) / <alpha-value>)',
        'temperature-badge':
          'rgb(var(--color-temperature-badge-rgb) / <alpha-value>)',
        'temperature-badge-ink':
          'rgb(var(--color-temperature-badge-ink-rgb) / <alpha-value>)',
        'humidity-badge': 'rgb(var(--color-humidity-badge-rgb) / <alpha-value>)',
        'humidity-badge-ink':
          'rgb(var(--color-humidity-badge-ink-rgb) / <alpha-value>)',
        'battery-badge': 'rgb(var(--color-battery-badge-rgb) / <alpha-value>)',
        'battery-badge-ink':
          'rgb(var(--color-battery-badge-ink-rgb) / <alpha-value>)',
      },
    },
  },
  plugins: [],
}
