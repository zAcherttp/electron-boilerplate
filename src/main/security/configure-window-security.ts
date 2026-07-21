import type { BrowserWindow } from 'electron'
import type { RendererUrlPolicy } from './renderer-url-policy'
import { shell } from 'electron'

export function configureWindowSecurity(
  window: BrowserWindow,
  urlPolicy: RendererUrlPolicy,
): void {
  window.webContents.on('will-frame-navigate', (event) => {
    if (!urlPolicy.isTrustedRendererUrl(event.url))
      event.preventDefault()
  })

  window.webContents.on('will-attach-webview', (event) => {
    event.preventDefault()
  })

  window.webContents.setWindowOpenHandler((details) => {
    if (urlPolicy.isTrustedExternalUrl(details.url))
      void shell.openExternal(details.url).catch(() => undefined)

    return { action: 'deny' }
  })
}
