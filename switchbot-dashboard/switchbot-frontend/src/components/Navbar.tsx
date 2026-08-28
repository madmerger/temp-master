import { useTheme } from '../contexts/ThemeContext';

interface NavbarProps {
  connected: boolean;
}

export function Navbar({ connected }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="border-b border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <a className="text-lg font-semibold text-slate-900 dark:text-slate-100" href="#">
            Temp Master Dashboard
          </a>
          <a className="hidden text-sm font-medium text-blue-600 dark:text-blue-400 sm:inline" href="/">
            Dashboard
          </a>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-md border border-slate-300 px-2.5 py-1.5 text-lg leading-none text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          >
            {theme === 'light' ? '☾' : '☀'}
          </button>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${connected ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200' : 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200'}`}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    </nav>
  );
}
