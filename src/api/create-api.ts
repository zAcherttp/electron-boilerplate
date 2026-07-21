import type { ApiError } from '../contracts/api-error'
import type { SystemInfo } from '../contracts/system-info'
import { Hono } from 'hono'
import { systemInfoSchema } from '../contracts/system-info'

export interface ApiDependencies {
  getSystemInfo: () => Promise<SystemInfo> | SystemInfo
}

const internalError: ApiError = {
  code: 'internal_error',
  message: 'The API could not complete the request.',
}

const notFoundError: ApiError = {
  code: 'not_found',
  message: 'The requested API route does not exist.',
}

export function createApi(dependencies: ApiDependencies) {
  const api = new Hono()

  api.notFound((context) => context.json(notFoundError, 404))
  api.onError((_error, context) => context.json(internalError, 500))

  return api.get('/system/info', async (context) => {
    const systemInfo = systemInfoSchema.parse(await dependencies.getSystemInfo())
    return context.json(systemInfo)
  })
}

export type ApplicationApi = ReturnType<typeof createApi>
