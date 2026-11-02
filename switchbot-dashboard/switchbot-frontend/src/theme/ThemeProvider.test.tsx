import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from './ThemeProvider';
import { useTheme } from './useTheme';

function ThemeProbe() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span>{theme}</span>
      <button type="button" onClick={toggleTheme}>
        Toggle
      </button>
    </div>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: true,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });
  });

  it('uses the dark OS preference when storage has no theme', () => {
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );
    expect(screen.getByText('dark')).toBeTruthy();
  });

  it('prefers a stored theme over the OS preference', () => {
    localStorage.setItem('theme', 'light');
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );
    expect(screen.getByText('light')).toBeTruthy();
  });

  it('persists theme toggles and updates the document theme', () => {
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));
    expect(screen.getByText('light')).toBeTruthy();
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
  });
});
