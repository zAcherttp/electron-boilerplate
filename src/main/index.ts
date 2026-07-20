import { join } from 'node:path'
import { app, BrowserWindow } from 'electron'
import { createApi } from '../api/create-api'
import { registerSystemInfoIpc } from './system/register-system-info-ipc'

const rendererDevelopmentUrl = process.env.DS_RENDERER_URL
let mainWindow: BrowserWindow | null = null

function readRuntimeVersion(name: 'chrome' | 'electron' | 'node'): string {
  const version = process.versions[name]

  if (!version)
    throw new Error(`Missing ${name} runtime version`)

  return version
}

const api = createApi({
  getSystemInfo: () => ({
    appVersion: app.getVersion(),
    architecture: process.arch,
    platform: process.platform,
    runtimeVersions: {
      chrome: readRuntimeVersion('chrome'),
      electron: readRuntimeVersion('electron'),
      node: readRuntimeVersion('node'),
    },
  }),
})

const removeSystemInfoIpc = registerSystemInfoIpc({
  api,
  getWindow: () => mainWindow,
})

function createWindow(): void {
  const window = new BrowserWindow({
    width: 960,
    height: 680,
    minWidth: 720,
    minHeight: 520,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
    },
  })
  mainWindow = window

  window.once('closed', () => {
    mainWindow = null
  })

  if (rendererDevelopmentUrl) {
    void window.loadURL(rendererDevelopmentUrl)
  }
  else {
    void window.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

void app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (mainWindow === null)
      createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin')
    app.quit()
})

app.once('will-quit', removeSystemInfoIpc)
