import { join } from 'node:path'
import { app, BrowserWindow, session } from 'electron'
import { createApi } from '../api/create-api'
import { createApiClient } from '../api/create-api-client'
import { registerSingleInstance } from './lifecycle/register-single-instance'
import { configureSessionSecurity } from './security/configure-session-security'
import { configureWindowSecurity } from './security/configure-window-security'
import { createRendererUrlPolicy } from './security/renderer-url-policy'
import {
  registerRendererProtocol,
  registerRendererScheme,
  rendererUrl,
} from './security/renderer-protocol'
import { registerSystemInfoIpc } from './system/register-system-info-ipc'

const rendererDevelopmentUrl = process.env.DS_RENDERER_URL
const trustedExternalOrigins: string[] = []
let mainWindow: BrowserWindow | null = null

registerRendererScheme()

const singleInstance = registerSingleInstance(() => mainWindow)

function readRuntimeVersion(name: 'chrome' | 'electron' | 'node'): string {
  const version = process.versions[name]

  if (!version)
    throw new Error(`Missing ${name} runtime version`)

  return version
}

function createWindow(): void {
  const activeRendererUrl = rendererDevelopmentUrl ?? rendererUrl
  const urlPolicy = createRendererUrlPolicy({
    rendererUrl: activeRendererUrl,
    trustedExternalOrigins,
  })
  const window = new BrowserWindow({
    width: 960,
    height: 680,
    minWidth: 720,
    minHeight: 520,
    webPreferences: {
      allowRunningInsecureContent: false,
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      webSecurity: true,
    },
  })
  mainWindow = window

  configureWindowSecurity(window, urlPolicy)

  window.once('closed', () => {
    mainWindow = null
  })

  void window.loadURL(activeRendererUrl)
}

function startApplication(): void {
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
    apiClient: createApiClient(api),
    getWindow: () => mainWindow,
  })

  void app.whenReady().then(() => {
    configureSessionSecurity(session.defaultSession)
    const removeRendererProtocol = registerRendererProtocol(join(__dirname, '../renderer'))

    app.once('will-quit', removeRendererProtocol)
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

  app.once('will-quit', () => {
    removeSystemInfoIpc()
    singleInstance.dispose()
  })
}

if (singleInstance.acquired)
  startApplication()
