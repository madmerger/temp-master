import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { THEME_STORAGE_KEY } from '../config'
import { ThemeProvider } from './ThemeProvider'
import { useTheme } from './useTheme'

function ThemeDisplay() {
  const { theme, toggleTheme } = useTheme()
  return (
    <>
      <span>{theme}</span>
      <button type="button" onClick={toggleTheme}>
        Toggle
      </button>
    </>
  )
}

function mockColorScheme(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches,
      media: '(prefers-color-scheme: dark)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  )
}

function renderTheme() {
  return render(
    <ThemeProvider>
      <ThemeDisplay />
    </ThemeProvider>,
  )
}

describe('ThemeProvider', () => {
  afterEach(cleanup)

  beforeEach(() => {
    window.localStorage.clear()
    mockColorScheme(false)
  })

  it('uses a dark system preference when no value is stored', () => {
    mockColorScheme(true)
    renderTheme()
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  })

  it('uses a light system preference when no value is stored', () => {
    renderTheme()
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
  })

  it('lets a stored light theme override a dark system preference', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light')
    mockColorScheme(true)
    renderTheme()
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
  })

  it('toggles the theme and persists the selected value', () => {
    renderTheme()
    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }))
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
  })
})
