import { join } from 'node:path'
import { app, type BrowserWindow, session } from 'electron'
import { createApi } from '../api/create-api'
import { createApiClient } from '../api/create-api-client'
import { registerAppearance } from './appearance/register-appearance'
import { createApplicationWindow } from './application-window/create-application-window'
import { registerSingleInstance } from './lifecycle/register-single-instance'
import { createApplicationLogger } from './logging/create-application-logger'
import { configureSessionSecurity } from './security/configure-session-security'
import {
  registerRendererProtocol,
  registerRendererScheme,
  rendererUrl,
} from './security/renderer-protocol'
import { registerSystemInfoIpc } from './system/register-system-info-ipc'

const rendererDevelopmentUrl = process.env.DS_RENDERER_URL
const trustedExternalOrigins: string[] = []

function readRuntimeVersion(name: 'chrome' | 'electron' | 'node'): string {
  const version = process.versions[name]
  if (!version) throw new Error(`Missing ${name} runtime version`)
  return version
}

export function startApplication(): void {
  let mainWindow: BrowserWindow | null = null

  registerRendererScheme()

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
    return
  }

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

  const openApplicationWindow = (): void => {
    const activeRendererUrl = rendererDevelopmentUrl ?? rendererUrl
    const window = createApplicationWindow({
      appearance,
      logger,
      preloadPath: join(__dirname, '../preload/index.js'),
      rendererUrl: activeRendererUrl,
      trustedExternalOrigins,
    })
    mainWindow = window
    window.once('closed', () => {
      mainWindow = null
    })
  }

  void app
    .whenReady()
    .then(() => {
      logger.info('application ready')
      configureSessionSecurity(session.defaultSession)
      const removeRendererProtocol = registerRendererProtocol(join(__dirname, '../renderer'))

      app.once('will-quit', removeRendererProtocol)
      openApplicationWindow()
      app.on('activate', () => {
        if (mainWindow === null) openApplicationWindow()
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
