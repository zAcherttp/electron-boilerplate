import { join } from 'node:path'
import { app, BrowserWindow, session } from 'electron'
import { createApi } from '../api/create-api'
import { createApiClient } from '../api/create-api-client'
import { registerAppearance, type AppearanceRegistration } from './appearance/register-appearance'
import { registerApplicationWindowControls } from './application-window/register-application-window-controls'
import { registerSingleInstance } from './lifecycle/register-single-instance'
import { createApplicationLogger } from './logging/create-application-logger'
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
app.setName('Electron Boilerplate')
if (process.platform === 'win32') app.setAppUserModelId('dev.electron.boilerplate')
app.setAppLogsPath()

const applicationLogger = app.isPackaged
  ? createApplicationLogger({
      appVersion: app.getVersion(),
      logDirectory: app.getPath('logs'),
      mode: 'packaged',
    })
  : createApplicationLogger({
      appVersion: app.getVersion(),
      destination: 1,
      mode: 'development',
    })
const logger = applicationLogger.logger

process.on('uncaughtExceptionMonitor', (error, origin) => {
  logger.fatal({ err: error, origin }, 'uncaught main-process exception')
  applicationLogger.flush()
})

if (applicationLogger.storage.kind === 'stderr')
  logger.error(
    { reason: applicationLogger.storage.reason },
    'packaged file logging unavailable; using stderr',
  )

const singleInstance = registerSingleInstance(() => {
  logger.info('second instance requested')
  return mainWindow
})

if (!singleInstance.acquired) {
  logger.warn('application is already running')
  applicationLogger.flush()
}

function readRuntimeVersion(name: 'chrome' | 'electron' | 'node'): string {
  const version = process.versions[name]

  if (!version) throw new Error(`Missing ${name} runtime version`)

  return version
}

function createWindow(appearance: AppearanceRegistration): void {
  const activeRendererUrl = rendererDevelopmentUrl ?? rendererUrl
  const urlPolicy = createRendererUrlPolicy({
    rendererUrl: activeRendererUrl,
    trustedExternalOrigins,
  })
  const window = new BrowserWindow({
    autoHideMenuBar: true,
    backgroundColor: appearance.getBackgroundColor(),
    width: 960,
    height: 680,
    minWidth: 720,
    minHeight: 520,
    title: app.getName(),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
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
  const removeApplicationWindowControls = registerApplicationWindowControls({
    appName: app.getName(),
    usesNativeControls: process.platform === 'darwin',
    window,
  })

  configureWindowSecurity(window, urlPolicy)

  window.webContents.on('render-process-gone', (_event, details) => {
    logger.error(
      { exitCode: details.exitCode, reason: details.reason },
      'renderer process terminated',
    )
  })

  window.once('closed', () => {
    removeApplicationWindowControls()
    mainWindow = null
    logger.debug('main window closed')
  })

  void window.loadURL(activeRendererUrl).catch((error: Error) => {
    logger.error({ err: error }, 'renderer failed to load')
  })
}

function startApplication(): void {
  logger.info(
    {
      architecture: process.arch,
      logging: applicationLogger.storage,
      packaged: app.isPackaged,
      platform: process.platform,
    },
    'application starting',
  )
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
  const appearance = registerAppearance({
    getWindow: () => mainWindow,
    preferencesFilePath: join(app.getPath('userData'), 'appearance.json'),
  })

  if (appearance.preferencesStatus === 'recovered')
    logger.warn('invalid appearance preferences ignored; using the system theme')

  void app
    .whenReady()
    .then(() => {
      logger.info('application ready')
      configureSessionSecurity(session.defaultSession)
      const removeRendererProtocol = registerRendererProtocol(join(__dirname, '../renderer'))

      app.once('will-quit', removeRendererProtocol)
      createWindow(appearance)

      app.on('activate', () => {
        if (mainWindow === null) createWindow(appearance)
      })
    })
    .catch((error: Error) => {
      logger.fatal({ err: error }, 'application readiness failed')
      applicationLogger.flush()
      app.exit(1)
    })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

  app.once('will-quit', () => {
    logger.info('application stopping')
    appearance.dispose()
    removeSystemInfoIpc()
    singleInstance.dispose()
    applicationLogger.flush()
  })
}

if (singleInstance.acquired) startApplication()
