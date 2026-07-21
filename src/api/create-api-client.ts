import type { ApplicationApi } from './create-api'
import { hc } from 'hono/client'

export function createApiClient(api: ApplicationApi) {
  return hc<ApplicationApi>('http://application.local', {
    fetch: (input: string | URL | Request, init?: RequestInit) =>
      api.fetch(new Request(input, init)),
  })
}

export type ApplicationApiClient = ReturnType<typeof createApiClient>
