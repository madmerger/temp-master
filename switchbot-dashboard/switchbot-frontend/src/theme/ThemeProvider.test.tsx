import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ThemeSelector } from '../components/ThemeSelector';
import { ThemeProvider, useTheme } from './ThemeProvider';
import {
  readThemePreference,
  writeThemePreference,
} from './themePreference';

function ThemeProbe() {
  const { preference, resolvedTheme } = useTheme();
  return (
    <span>
      {preference}:{resolvedTheme}
    </span>
  );
}

describe('theme preference storage', () => {
  it('reads the saved preference and falls back to system', () => {
    localStorage.setItem('theme', 'dark');
    expect(readThemePreference()).toBe('dark');
    localStorage.setItem('theme', 'unknown');
    expect(readThemePreference()).toBe('system');
  });

  it('writes the preference to local storage', () => {
    writeThemePreference('light');
    expect(localStorage.getItem('theme')).toBe('light');
  });
});

describe('ThemeProvider', () => {
  it('applies the dark class for a saved dark preference', () => {
    localStorage.setItem('theme', 'dark');
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByText('dark:dark')).toBeInTheDocument();
    expect(document.documentElement).toHaveClass('dark');
  });

  it('uses and responds to the system color scheme in system mode', () => {
    let changeListener: ((event: MediaQueryListEvent) => void) | undefined;
    const addEventListener = vi.fn(
      (_event: string, listener: (event: MediaQueryListEvent) => void) => {
        changeListener = listener;
      },
    );
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addEventListener,
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList);
    localStorage.setItem('theme', 'system');

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByText('system:dark')).toBeInTheDocument();
    expect(document.documentElement).toHaveClass('dark');
    act(() => {
      changeListener?.({ matches: false } as MediaQueryListEvent);
    });
    expect(screen.getByText('system:light')).toBeInTheDocument();
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('persists a selection made with the theme control', () => {
    render(
      <ThemeProvider>
        <ThemeSelector />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'ダーク' }));

    expect(localStorage.getItem('theme')).toBe('dark');
    expect(screen.getByRole('button', { name: 'ダーク' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
