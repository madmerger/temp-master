import { useTheme } from '../theme/ThemeContext';

interface NavbarProps {
  connected: boolean;
}

export function Navbar({ connected }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
        <a href="#" className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Temp Master Dashboard
        </a>
        <a href="/" className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
          Dashboard
        </a>
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            aria-label="Toggle theme"
            onClick={toggleTheme}
            className="px-2 py-1 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {theme === 'dark' ? '☀ Light' : '🌙 Dark'}
          </button>
          <span
            className={`inline-block px-2 py-0.5 rounded text-xs font-semibold text-white ${
              connected ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    </nav>
  );
}
