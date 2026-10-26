import type { Theme } from '../theme'
import { ConnectionStatus } from './ConnectionStatus'

interface NavbarProps {
  connected: boolean
  theme: Theme
  onToggleTheme: () => void
}

export function Navbar({ connected, theme, onToggleTheme }: NavbarProps) {
  const nextMode = theme === 'dark' ? 'ライトモード' : 'ダークモード'

  return (
    <nav className="fixed inset-x-0 top-0 z-10 border-b border-border bg-panel shadow-sm">
      <div className="mx-auto flex min-h-14 max-w-screen-2xl items-center gap-5 px-4">
        <a className="shrink-0 text-lg font-semibold text-text no-underline" href="/">
          Temp Master Dashboard
        </a>
        <a
          aria-current="page"
          className="hidden h-14 items-center border-b-2 border-primary px-2 text-sm font-medium text-primary sm:flex"
          href="/"
        >
          Dashboard
        </a>
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            aria-label={nextMode}
            aria-pressed={theme === 'dark'}
            data-testid="theme-toggle"
            onClick={onToggleTheme}
            className="inline-flex items-center gap-2 rounded border border-border bg-panel px-3 py-2 text-sm text-text hover:bg-panel-heading focus-visible:outline-2 focus-visible:outline-primary"
          >
            <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
            {nextMode}
          </button>
          <ConnectionStatus connected={connected} />
        </div>
      </div>
    </nav>
  )
}
