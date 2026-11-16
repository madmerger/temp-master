export function Navbar({ connected }: { connected: boolean }) {
 return <nav className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5"><a className="text-xl font-bold tracking-tight" href="/">Temp Master Dashboard</a><span className={`rounded-full px-3 py-1 text-xs font-semibold ${connected ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>{connected ? 'Connected' : 'Disconnected'}</span></div></nav>;
}
