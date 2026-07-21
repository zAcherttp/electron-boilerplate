import { expect, type Page } from '@playwright/test'

export async function assertApplicationWindow(window: Page): Promise<void> {
  await expect(window).toHaveURL('app://bundle/index.html')
  await expect(window).toHaveTitle('Electron Boilerplate')
  await expect(
    window.getByRole('heading', {
      name: 'A small, explicit Electron stack.',
    }),
  ).toBeVisible()

  const electronVersion = window
    .locator('.runtime dl > div')
    .filter({ has: window.getByText('Electron', { exact: true }) })
    .locator('dd')
  const platform = window
    .locator('.runtime dl > div')
    .filter({ has: window.getByText('Platform', { exact: true }) })
    .locator('dd')
  const applicationVersion = window
    .locator('.runtime dl > div')
    .filter({ has: window.getByText('Application', { exact: true }) })
    .locator('dd')

  await expect(applicationVersion).toHaveText('0.1.0')
  await expect(electronVersion).toHaveText(/^\d+\.\d+\.\d+/)
  await expect(platform).toHaveText(/^\S+ \/ \S+$/)

  const exposedGlobals = await window.evaluate(() => ({
    bridge: 'app' in window,
    electron: 'ipcRenderer' in window,
    node: 'require' in window || 'process' in window,
  }))

  expect(exposedGlobals).toEqual({ bridge: true, electron: false, node: false })
}
