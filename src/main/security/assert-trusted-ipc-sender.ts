import type { BrowserWindow, IpcMainInvokeEvent } from 'electron'

export function assertTrustedIpcSender(
  event: IpcMainInvokeEvent,
  window: BrowserWindow | null,
): asserts window is BrowserWindow {
  if (
    window === null ||
    event.sender !== window.webContents ||
    event.senderFrame !== window.webContents.mainFrame
  ) {
    throw new Error('Rejected IPC request from an untrusted renderer')
  }
}
