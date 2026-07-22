import type { ApplicationApiClient } from '../../api/create-api-client'
import type { BrowserWindow } from 'electron'
import { ipcMain } from 'electron'
import { systemInfoSchema } from '../../contracts/system-info'
import { systemInfoChannel } from '../../contracts/system-info-channels'
import { assertTrustedIpcSender } from '../security/assert-trusted-ipc-sender'

interface RegisterSystemInfoIpcOptions {
  apiClient: ApplicationApiClient
  getWindow: () => BrowserWindow | null
}

export function registerSystemInfoIpc(options: RegisterSystemInfoIpcOptions): () => void {
  ipcMain.handle(systemInfoChannel, async (event) => {
    assertTrustedIpcSender(event, options.getWindow())

    const response = await options.apiClient.system.info.$get()

    if (!response.ok)
      throw new Error(`Application API request failed with status ${response.status}`)

    return systemInfoSchema.parse(await response.json())
  })

  return () => ipcMain.removeHandler(systemInfoChannel)
}
