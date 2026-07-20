import { describe, expect, it } from 'vitest'
import { apiErrorSchema } from '../contracts/api-error'
import { systemInfoSchema } from '../contracts/system-info'
import { createApi } from './create-api'

const systemInfo = systemInfoSchema.parse({
  appVersion: '0.1.0',
  architecture: 'x64',
  platform: 'win32',
  runtimeVersions: {
    chrome: '142.0.0',
    electron: '43.1.1',
    node: '24.0.0',
  },
})

describe('Application API', () => {
  it('serves system information without a network listener', async () => {
    const api = createApi({ getSystemInfo: () => systemInfo })

    const response = await api.request('/system/info')

    expect(response.status).toBe(200)
    expect(systemInfoSchema.parse(await response.json())).toEqual(systemInfo)
  })

  it('returns a structured error when a dependency fails', async () => {
    const api = createApi({
      getSystemInfo: () => {
        throw new Error('system information unavailable')
      },
    })

    const response = await api.request('/system/info')

    expect(response.status).toBe(500)
    expect(apiErrorSchema.parse(await response.json())).toEqual({
      code: 'internal_error',
      message: 'The API could not complete the request.',
    })
  })

  it('returns a structured error for an unknown route', async () => {
    const api = createApi({ getSystemInfo: () => systemInfo })

    const response = await api.request('/unknown')

    expect(response.status).toBe(404)
    expect(apiErrorSchema.parse(await response.json())).toEqual({
      code: 'not_found',
      message: 'The requested API route does not exist.',
    })
  })
})
