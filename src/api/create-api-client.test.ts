import { describe, expect, it } from 'vitest'
import { systemInfoSchema } from '../contracts/system-info'
import { createApi } from './create-api'
import { createApiClient } from './create-api-client'

describe('Application API client', () => {
  it('uses the typed Hono client without opening a network connection', async () => {
    const systemInfo = systemInfoSchema.parse({
      appVersion: '0.1.0',
      architecture: 'x64',
      platform: 'win32',
      runtimeVersions: {
        chrome: '150.0.0',
        electron: '43.1.1',
        node: '24.18.0',
      },
    })
    const apiClient = createApiClient(createApi({ getSystemInfo: () => systemInfo }))

    const response = await apiClient.system.info.$get()

    expect(response.status).toBe(200)
    expect(systemInfoSchema.parse(await response.json())).toEqual(systemInfo)
  })
})
