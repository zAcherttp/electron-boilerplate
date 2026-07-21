import type { BrowserWindow } from 'electron'
import { app } from 'electron'

interface SingleInstanceRegistration {
  acquired: boolean
  dispose: () => void
}

function focusWindow(window: BrowserWindow | null): void {
  if (window === null) return

  if (window.isMinimized()) window.restore()

  window.show()
  window.focus()
}

export function registerSingleInstance(
  getWindow: () => BrowserWindow | null,
): SingleInstanceRegistration {
  if (!app.requestSingleInstanceLock()) {
    app.quit()
    return { acquired: false, dispose: () => undefined }
  }

  const handleSecondInstance = () => focusWindow(getWindow())
  app.on('second-instance', handleSecondInstance)

  return {
    acquired: true,
    dispose: () => {
      app.off('second-instance', handleSecondInstance)
      app.releaseSingleInstanceLock()
    },
  }
}
