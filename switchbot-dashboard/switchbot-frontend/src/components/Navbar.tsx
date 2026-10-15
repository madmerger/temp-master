import { Moon, Sun } from 'lucide-react';

interface NavbarProps {
  disconnected: boolean;
  isDark: boolean;
  onToggleDarkMode: () => void;
}

export function Navbar({ disconnected, isDark, onToggleDarkMode }: NavbarProps) {
  const ThemeIcon = isDark ? Sun : Moon;

  return (
    <nav className="fixed inset-x-0 top-0 z-20 border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center gap-8 px-4 sm:px-6">
        <a className="whitespace-nowrap text-lg font-semibold text-gray-900 dark:text-gray-100" href="/">
          Temp Master Dashboard
        </a>
        <a
          className="flex h-16 items-center border-b-2 border-blue-600 px-1 text-sm font-medium text-blue-700 dark:text-blue-300"
          href="/"
          aria-current="page"
        >
          Dashboard
        </a>
        <div className="ml-auto flex items-center gap-4">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              disconnected
                ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
                : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
            }`}
          >
            {disconnected ? 'Disconnected' : 'Connected'}
          </span>
          <button
            type="button"
            onClick={onToggleDarkMode}
            aria-label="Toggle dark mode"
            data-testid="theme-toggle"
            className="rounded-md p-2 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <ThemeIcon size={20} aria-hidden="true" />
          </button>
        </div>
      </div>
    </nav>
  );
}
