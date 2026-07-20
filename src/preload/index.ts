import type { AppApi } from '../contracts/app-api'
import { contextBridge, ipcRenderer } from 'electron'
import { systemInfoChannel } from '../contracts/app-api'

const appApi: AppApi = {
  system: {
    getInfo: () => ipcRenderer.invoke(systemInfoChannel),
  },
}

contextBridge.exposeInMainWorld('app', appApi)
