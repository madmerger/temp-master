interface NavbarProps {
  connected: boolean;
  isDark: boolean;
  onToggleDark: () => void;
}

function SunIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path strokeLinecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function Navbar({ connected, isDark, onToggleDark }: NavbarProps) {
  return (
    <nav className="fixed inset-x-0 top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-700 dark:bg-gray-900/95">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <a href="/" className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Temp Master Dashboard
          </a>
          <a
            href="/"
            className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-900 dark:bg-gray-800 dark:text-gray-100"
          >
            Dashboard
          </a>
        </div>
        <div className="flex items-center gap-3">
          <span
            data-testid="connection-status"
            className={`rounded px-2 py-0.5 text-xs font-semibold text-white ${
              connected ? 'bg-green-600 dark:bg-green-700' : 'bg-red-600 dark:bg-red-700'
            }`}
          >
            {connected ? 'Connected' : 'Disconnected'}
          </span>
          <button
            type="button"
            onClick={onToggleDark}
            aria-label={isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
            title={isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
            className="rounded-md p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </div>
    </nav>
  );
}
