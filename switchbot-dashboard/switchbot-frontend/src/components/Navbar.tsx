import ThemeToggle from './ThemeToggle';

interface Props {
  connected: boolean;
}

export default function Navbar({ connected }: Props) {
  return (
    <nav className="fixed inset-x-0 top-0 z-10 border-b border-gray-200 bg-white/95 shadow-sm dark:border-gray-700 dark:bg-gray-800/95">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <a className="text-lg font-semibold text-gray-700 dark:text-gray-100" href="/">Temp Master Dashboard</a>
          <a className="hidden text-sm text-gray-600 dark:text-gray-300 sm:block" href="/">Dashboard</a>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded px-2 py-1 text-xs font-semibold text-white ${connected ? 'bg-green-600' : 'bg-red-600'}`}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
