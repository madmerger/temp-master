export const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

export function buildApiUrl(path: string, base: string = API_BASE_URL): string {
  const normalizedPath = path.replace(/^\/+/, '')
  const normalizedBase = base.replace(/\/+$/, '')

  return normalizedBase ? `${normalizedBase}/${normalizedPath}` : `/${normalizedPath}`
}
