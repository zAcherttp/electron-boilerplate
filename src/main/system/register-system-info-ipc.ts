import type { ApplicationApi } from '../../api/create-api'
import type { BrowserWindow } from 'electron'
import { ipcMain } from 'electron'
import { apiErrorSchema } from '../../contracts/api-error'
import { systemInfoChannel } from '../../contracts/app-api'
import { systemInfoRequestSchema, systemInfoSchema } from '../../contracts/system-info'

interface RegisterSystemInfoIpcOptions {
  api: ApplicationApi
  getWindow: () => BrowserWindow | null
}

export function registerSystemInfoIpc(options: RegisterSystemInfoIpcOptions): () => void {
  ipcMain.handle(systemInfoChannel, async (event, request: unknown) => {
    const window = options.getWindow()

    if (
      window === null
      || event.sender !== window.webContents
      || event.senderFrame !== window.webContents.mainFrame
    ) {
      throw new Error('Rejected system information request from an untrusted renderer')
    }

    systemInfoRequestSchema.parse(request)

    const response = await options.api.request('/system/info')
    const payload: unknown = await response.json()

    if (!response.ok) {
      const error = apiErrorSchema.parse(payload)
      throw new Error(`${error.code}: ${error.message}`)
    }

    return systemInfoSchema.parse(payload)
  })

  return () => ipcMain.removeHandler(systemInfoChannel)
}
