interface ConnectionStatusProps {
  connected: boolean
}

export function ConnectionStatus({ connected }: ConnectionStatusProps) {
  return (
    <span
      id="connection-status"
      className={`rounded px-2.5 py-1 text-xs font-bold text-label-text ${
        connected ? 'bg-label-success' : 'bg-label-danger'
      }`}
    >
      {connected ? 'Connected' : 'Disconnected'}
    </span>
  )
}
