import { ThemeToggle } from './ThemeToggle'

export function Navbar({ connected }: { connected: boolean }) {
  return (
    <nav className="fixed inset-x-0 top-0 z-10 border-b border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-4 px-4 py-3">
        <a href="/" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Temp Master Dashboard
        </a>
        <a
          href="/"
          className="text-sm font-medium text-slate-700 underline-offset-4 hover:underline dark:text-slate-300"
        >
          Dashboard
        </a>
        <div className="ml-auto flex items-center gap-3">
          <span
            className={`rounded px-2 py-1 text-xs font-semibold text-white ${
              connected ? 'bg-emerald-600' : 'bg-red-600'
            }`}
          >
            {connected ? 'Connected' : 'Disconnected'}
          </span>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
}
