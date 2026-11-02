import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from './theme';
import { useTheme } from './useTheme';

function ThemeProbe() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button type="button" aria-label="Toggle theme" onClick={toggleTheme}>
      {theme}
    </button>
  );
}

function renderTheme() {
  return render(
    <ThemeProvider>
      <ThemeProbe />
    </ThemeProvider>,
  );
}

function setSystemTheme(isDark: boolean) {
  const mediaQuery = {
    matches: isDark,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as MediaQueryList;
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mediaQuery));
}

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('ThemeProvider', () => {
  it('defaults to dark when the system preference is dark', () => {
    setSystemTheme(true);

    renderTheme();

    expect(screen.getByText('dark')).toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('uses a stored light choice over the dark system preference', () => {
    localStorage.setItem('temp-master-theme', 'light');
    setSystemTheme(true);

    renderTheme();

    expect(screen.getByText('light')).toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('toggles the root theme and persists the selected choice', () => {
    setSystemTheme(false);
    renderTheme();

    fireEvent.click(screen.getByRole('button', { name: 'Toggle theme' }));

    expect(screen.getByText('dark')).toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('temp-master-theme')).toBe('dark');
  });

  it('does not crash when localStorage access throws', () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get: () => {
        throw new Error('storage disabled');
      },
    });
    setSystemTheme(false);

    expect(() => renderTheme()).not.toThrow();

    if (descriptor) {
      Object.defineProperty(window, 'localStorage', descriptor);
    }
  });
});
