import type { DesktopApi } from '../contracts/desktop-api'
import { contextBridge } from 'electron'

function readRuntimeVersion(name: 'chrome' | 'electron' | 'node'): string {
  const version = process.versions[name]

  if (!version)
    throw new Error(`Missing ${name} runtime version`)

  return version
}

const desktopApi: DesktopApi = {
  versions: {
    chrome: readRuntimeVersion('chrome'),
    electron: readRuntimeVersion('electron'),
    node: readRuntimeVersion('node'),
  },
}

contextBridge.exposeInMainWorld('desktop', desktopApi)
