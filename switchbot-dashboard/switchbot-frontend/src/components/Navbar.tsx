import ThemeToggle from './ThemeToggle'

interface NavbarProps {
  connected: boolean
  theme: 'light' | 'dark'
  toggle: () => void
}

export default function Navbar({ connected, theme, toggle }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <a href="/" className="text-lg font-semibold text-gray-900 dark:text-white">
          Temp Master Dashboard
        </a>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center rounded px-2.5 py-0.5 text-sm font-medium ${
              connected
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}
          >
            {connected ? 'Connected' : 'Disconnected'}
          </span>
          <ThemeToggle theme={theme} toggle={toggle} />
        </div>
      </div>
    </nav>
  )
}
