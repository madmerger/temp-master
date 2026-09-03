import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from './ThemeContext';
import { ThemeToggle } from '../components/Navbar';

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
  });

  it('follows OS preference and toggles to light', async () => {
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>);
    expect(document.documentElement.dataset.theme).toBe('dark');
    await userEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('prefers stored theme over OS preference', () => {
    localStorage.setItem('theme', 'light');
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>);
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
