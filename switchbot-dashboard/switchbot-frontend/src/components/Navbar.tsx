import { useTheme } from '../hooks/useTheme';

interface Props {
  connected: boolean | null;
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="テーマ切り替え"
      title={isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
    >
      {isDark ? (
        // Sun icon
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        // Moon icon
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

export default function Navbar({ connected }: Props) {
  const connecting = connected === null;
  return (
    <nav className="fixed inset-x-0 top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur dark:border-gray-700 dark:bg-gray-900/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Temp Master Dashboard
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ' +
              (connecting
                ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                : connected
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300')
            }
          >
            <span
              className={
                'h-2 w-2 rounded-full ' +
                (connecting
                  ? 'animate-pulse bg-gray-400'
                  : connected
                    ? 'bg-green-500'
                    : 'bg-red-500')
              }
            />
            {connecting ? 'Connecting…' : connected ? 'Connected' : 'Disconnected'}
          </span>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
