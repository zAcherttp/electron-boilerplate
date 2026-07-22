import type { AppearanceState, ThemeSource } from './appearance'
import type { ApplicationWindowState } from './application-window'
import type { SystemInfo } from './system-info'

export interface AppApi {
  appearance: {
    getState: () => Promise<AppearanceState>
    onStateChanged: (listener: (state: AppearanceState) => void) => () => void
    setSource: (source: ThemeSource) => Promise<AppearanceState>
  }
  applicationWindow: {
    close: () => Promise<void>
    getState: () => Promise<ApplicationWindowState>
    minimize: () => Promise<void>
    onStateChanged: (listener: (state: ApplicationWindowState) => void) => () => void
    toggleMaximize: () => Promise<void>
  }
  system: {
    getInfo: () => Promise<SystemInfo>
  }
}

declare global {
  interface Window {
    app: AppApi
  }
}
