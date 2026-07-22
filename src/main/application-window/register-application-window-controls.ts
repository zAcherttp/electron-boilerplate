import type { BrowserWindow } from 'electron'
import { ipcMain } from 'electron'
import { applicationWindowStateSchema } from '../../contracts/application-window'
import {
  applicationWindowCloseChannel,
  applicationWindowGetStateChannel,
  applicationWindowMinimizeChannel,
  applicationWindowStateChangedChannel,
  applicationWindowToggleMaximizeChannel,
} from '../../contracts/application-window-channels'
import { assertTrustedIpcSender } from '../security/assert-trusted-ipc-sender'

interface RegisterApplicationWindowControlsOptions {
  appName: string
  usesNativeControls: boolean
  window: BrowserWindow
}

function readApplicationWindowState(
  options: RegisterApplicationWindowControlsOptions,
): ReturnType<typeof applicationWindowStateSchema.parse> {
  return applicationWindowStateSchema.parse({
    appName: options.appName,
    isFocused: options.window.isFocused(),
    isMaximized: options.window.isMaximized(),
    usesNativeControls: options.usesNativeControls,
  })
}

export function registerApplicationWindowControls(
  options: RegisterApplicationWindowControlsOptions,
): () => void {
  const sendState = (): void => {
    if (options.window.webContents.isDestroyed()) return
    options.window.webContents.send(
      applicationWindowStateChangedChannel,
      readApplicationWindowState(options),
    )
  }

  ipcMain.handle(applicationWindowGetStateChannel, (event) => {
    assertTrustedIpcSender(event, options.window)
    return readApplicationWindowState(options)
  })
  ipcMain.handle(applicationWindowMinimizeChannel, (event) => {
    assertTrustedIpcSender(event, options.window)
    options.window.minimize()
  })
  ipcMain.handle(applicationWindowToggleMaximizeChannel, (event) => {
    assertTrustedIpcSender(event, options.window)

    if (options.window.isMaximized()) options.window.unmaximize()
    else options.window.maximize()
  })
  ipcMain.handle(applicationWindowCloseChannel, (event) => {
    assertTrustedIpcSender(event, options.window)
    setImmediate(() => {
      if (!options.window.isDestroyed()) options.window.close()
    })
  })

  options.window.on('focus', sendState)
  options.window.on('blur', sendState)
  options.window.on('maximize', sendState)
  options.window.on('unmaximize', sendState)

  return () => {
    ipcMain.removeHandler(applicationWindowGetStateChannel)
    ipcMain.removeHandler(applicationWindowMinimizeChannel)
    ipcMain.removeHandler(applicationWindowToggleMaximizeChannel)
    ipcMain.removeHandler(applicationWindowCloseChannel)
    options.window.off('focus', sendState)
    options.window.off('blur', sendState)
    options.window.off('maximize', sendState)
    options.window.off('unmaximize', sendState)
  }
}
