import { createApiClient } from '@temp-master/shared'

// The legacy dashboard downloads the SQLite snapshot from its own FastAPI host.
export const api = createApiClient(import.meta.env.VITE_API_URL, '')
