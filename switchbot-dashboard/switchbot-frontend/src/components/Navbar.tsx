export function Navbar({ connected }: { connected: boolean }) {
  return (
    <nav className="fixed inset-x-0 top-0 z-10 border-b border-slate-300 bg-white">
      <div className="flex flex-wrap items-center gap-4 px-4 py-3">
        <a href="/" className="text-lg font-semibold text-slate-900">
          Temp Master Dashboard
        </a>
        <a
          href="/"
          className="text-sm font-medium text-slate-700 underline-offset-4 hover:underline"
        >
          Dashboard
        </a>
        <span
          className={`ml-auto rounded px-2 py-1 text-xs font-semibold text-white ${
            connected ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
    </nav>
  )
}
