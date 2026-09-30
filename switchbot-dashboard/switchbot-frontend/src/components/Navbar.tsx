import ThemeToggle from './ThemeToggle'

interface NavbarProps {
  connected: boolean
}

export default function Navbar({ connected }: NavbarProps) {
  return (
    <nav className="fixed inset-x-0 top-0 z-20 border-b border-gray-300 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex min-h-14 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <a href="/" className="text-lg font-semibold text-gray-800 dark:text-gray-100">Temp Master Dashboard</a>
          <a href="/" aria-current="page" className="hidden border-b-2 border-blue-600 px-1 py-4 text-sm font-medium text-blue-700 dark:text-blue-300 sm:inline-block">Dashboard</a>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <span
            data-testid="connection-status"
            className={`rounded px-2 py-1 text-xs font-semibold text-white ${connected ? 'bg-green-600' : 'bg-red-600'}`}
          >
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    </nav>
  )
}
