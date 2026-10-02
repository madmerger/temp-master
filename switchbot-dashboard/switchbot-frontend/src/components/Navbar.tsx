interface NavbarProps {
  disconnected: boolean
}

export function Navbar({ disconnected }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-10 border-b border-gray-300 bg-gray-100 shadow-sm">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <a className="text-lg font-semibold text-gray-800 no-underline" href="/">
            Temp Master Dashboard
          </a>
          <a
            aria-current="page"
            className="border-b-2 border-blue-600 py-1 text-sm font-medium text-blue-700 no-underline"
            href="/"
          >
            Dashboard
          </a>
        </div>
        <span
          className={`rounded px-2 py-1 text-xs font-semibold text-white ${
            disconnected ? 'bg-red-600' : 'bg-green-600'
          }`}
        >
          {disconnected ? 'Disconnected' : 'Connected'}
        </span>
      </div>
    </nav>
  )
}
