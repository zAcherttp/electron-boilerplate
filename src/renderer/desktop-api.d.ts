import type { DesktopApi } from '../contracts/desktop-api'

declare global {
  interface Window {
    desktop: DesktopApi
  }
}

export {}
