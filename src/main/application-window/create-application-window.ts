import type { AppearanceRegistration } from '../appearance/register-appearance'
import type { Logger } from 'pino'
import { app, BrowserWindow } from 'electron'
import { registerApplicationWindowControls } from './register-application-window-controls'
import { configureWindowSecurity } from '../security/configure-window-security'
import { createRendererUrlPolicy } from '../security/renderer-url-policy'

interface CreateApplicationWindowOptions {
  appearance: AppearanceRegistration
  logger: Pick<Logger, 'debug' | 'error'>
  preloadPath: string
  rendererUrl: string
  trustedExternalOrigins: string[]
}

export function createApplicationWindow(options: CreateApplicationWindowOptions): BrowserWindow {
  const rendererUrlPolicy = createRendererUrlPolicy({
    rendererUrl: options.rendererUrl,
    trustedExternalOrigins: options.trustedExternalOrigins,
  })
  const window = new BrowserWindow({
    autoHideMenuBar: true,
    backgroundColor: options.appearance.getBackgroundColor(),
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
      preload: options.preloadPath,
      sandbox: true,
      webSecurity: true,
    },
  })
  const removeApplicationWindowControls = registerApplicationWindowControls({
    appName: app.getName(),
    usesNativeControls: process.platform === 'darwin',
    window,
  })

  configureWindowSecurity(window, rendererUrlPolicy)

  window.webContents.on('render-process-gone', (_event, details) => {
    options.logger.error(
      { exitCode: details.exitCode, reason: details.reason },
      'renderer process terminated',
    )
  })
  window.once('closed', () => {
    removeApplicationWindowControls()
    options.logger.debug('main window closed')
  })

  void window.loadURL(options.rendererUrl).catch((error: Error) => {
    options.logger.error({ err: error }, 'renderer failed to load')
  })

  return window
}
