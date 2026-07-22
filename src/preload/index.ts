import type { AppApi } from '../contracts/app-api'
import { contextBridge, ipcRenderer } from 'electron'
import {
  appearanceGetStateChannel,
  appearanceSetSourceChannel,
  appearanceStateChangedChannel,
} from '../contracts/appearance-channels'
import {
  applicationWindowCloseChannel,
  applicationWindowGetStateChannel,
  applicationWindowMinimizeChannel,
  applicationWindowStateChangedChannel,
  applicationWindowToggleMaximizeChannel,
} from '../contracts/application-window-channels'
import { systemInfoChannel } from '../contracts/system-info-channels'

const appApi: AppApi = {
  appearance: {
    getState: () => ipcRenderer.invoke(appearanceGetStateChannel),
    onStateChanged: (listener) => {
      const handleStateChanged: Parameters<typeof ipcRenderer.on>[1] = (_event, state) => {
        listener(state)
      }

      ipcRenderer.on(appearanceStateChangedChannel, handleStateChanged)
      return () => ipcRenderer.removeListener(appearanceStateChangedChannel, handleStateChanged)
    },
    setSource: (source) => ipcRenderer.invoke(appearanceSetSourceChannel, source),
  },
  applicationWindow: {
    close: async () => {
      await ipcRenderer.invoke(applicationWindowCloseChannel)
    },
    getState: () => ipcRenderer.invoke(applicationWindowGetStateChannel),
    minimize: async () => {
      await ipcRenderer.invoke(applicationWindowMinimizeChannel)
    },
    onStateChanged: (listener) => {
      const handleStateChanged: Parameters<typeof ipcRenderer.on>[1] = (_event, state) => {
        listener(state)
      }

      ipcRenderer.on(applicationWindowStateChangedChannel, handleStateChanged)
      return () =>
        ipcRenderer.removeListener(applicationWindowStateChangedChannel, handleStateChanged)
    },
    toggleMaximize: async () => {
      await ipcRenderer.invoke(applicationWindowToggleMaximizeChannel)
    },
  },
  system: {
    getInfo: () => ipcRenderer.invoke(systemInfoChannel),
  },
}

contextBridge.exposeInMainWorld('app', appApi)
