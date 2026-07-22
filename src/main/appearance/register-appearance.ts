import type { BrowserWindow } from 'electron'
import { ipcMain, nativeTheme } from 'electron'
import {
  appearanceStateSchema,
  themeSourceSchema,
  type AppearanceState,
} from '../../contracts/appearance'
import {
  appearanceGetStateChannel,
  appearanceSetSourceChannel,
  appearanceStateChangedChannel,
} from '../../contracts/appearance-channels'
import { assertTrustedIpcSender } from '../security/assert-trusted-ipc-sender'
import {
  readAppearancePreferences,
  writeAppearancePreferences,
  type AppearancePreferencesReadResult,
} from './appearance-preferences'

const windowBackgroundColors = {
  dark: '#1c1a18',
  light: '#f7f8f7',
}

interface RegisterAppearanceOptions {
  getWindow: () => BrowserWindow | null
  preferencesFilePath: string
}

export interface AppearanceRegistration {
  dispose: () => void
  getBackgroundColor: () => string
  preferencesStatus: AppearancePreferencesReadResult['status']
}

function readAppearanceState(): AppearanceState {
  return appearanceStateSchema.parse({
    resolved: nativeTheme.shouldUseDarkColors ? 'dark' : 'light',
    source: nativeTheme.themeSource,
  })
}

export function registerAppearance(options: RegisterAppearanceOptions): AppearanceRegistration {
  const storedPreferences = readAppearancePreferences(options.preferencesFilePath)
  nativeTheme.themeSource = storedPreferences.preferences.themeSource

  const getBackgroundColor = (): string =>
    windowBackgroundColors[nativeTheme.shouldUseDarkColors ? 'dark' : 'light']

  const publishState = (): void => {
    const window = options.getWindow()
    if (window === null || window.isDestroyed()) return

    window.setBackgroundColor(getBackgroundColor())
    if (!window.webContents.isDestroyed())
      window.webContents.send(appearanceStateChangedChannel, readAppearanceState())
  }

  ipcMain.handle(appearanceGetStateChannel, (event) => {
    assertTrustedIpcSender(event, options.getWindow())
    return readAppearanceState()
  })
  ipcMain.handle(appearanceSetSourceChannel, (event, source) => {
    assertTrustedIpcSender(event, options.getWindow())
    const parsedSource = themeSourceSchema.parse(source)

    writeAppearancePreferences(options.preferencesFilePath, {
      themeSource: parsedSource,
      version: 1,
    })
    nativeTheme.themeSource = parsedSource
    publishState()
    return readAppearanceState()
  })
  nativeTheme.on('updated', publishState)

  return {
    dispose: () => {
      ipcMain.removeHandler(appearanceGetStateChannel)
      ipcMain.removeHandler(appearanceSetSourceChannel)
      nativeTheme.off('updated', publishState)
    },
    getBackgroundColor,
    preferencesStatus: storedPreferences.status,
  }
}
