import type { SystemInfo } from './system-info'

export const systemInfoChannel = 'app:system:get-info'

export interface AppApi {
  system: {
    getInfo: () => Promise<SystemInfo>
  }
}

declare global {
  interface Window {
    app: AppApi
  }
}
