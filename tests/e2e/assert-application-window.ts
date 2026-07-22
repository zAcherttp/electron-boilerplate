import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, type Page } from '@playwright/test'
import { z } from 'zod'

const packageVersion = z
  .object({ version: z.string() })
  .parse(JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf8'))).version

export async function assertApplicationWindow(window: Page): Promise<void> {
  await expect(window).toHaveURL('app://bundle/index.html')
  await expect(window).toHaveTitle('Electron Boilerplate')
  await expect(
    window.getByRole('banner', {
      name: 'Electron Boilerplate window',
    }),
  ).toBeVisible()

  const applicationViewport = window.locator('[data-slot="scroll-area-viewport"]')
  await expect(applicationViewport).toBeVisible()
  const frameMetrics = await window.evaluate(() => {
    const titleBar = document.querySelector('.application-title-bar')
    const viewport = document.querySelector('[data-slot="scroll-area-viewport"]')

    if (titleBar === null || viewport === null)
      throw new Error('Application frame is missing its title bar or viewport')

    return {
      documentHeight: document.documentElement.clientHeight,
      documentScrollHeight: document.documentElement.scrollHeight,
      titleBarBottom: titleBar.getBoundingClientRect().bottom,
      viewportTop: viewport.getBoundingClientRect().top,
    }
  })

  expect(frameMetrics.viewportTop).toBe(frameMetrics.titleBarBottom)
  expect(frameMetrics.documentScrollHeight).toBe(frameMetrics.documentHeight)

  if (process.platform === 'darwin') {
    await expect(window.getByRole('button', { name: 'Minimize' })).toHaveCount(0)
    await expect(window.getByRole('button', { name: 'Maximize' })).toHaveCount(0)
    await expect(window.getByRole('button', { name: 'Close' })).toHaveCount(0)
  } else {
    const maximizeButton = window.getByRole('button', { name: 'Maximize' })
    await expect(maximizeButton).toBeVisible()
    await expect(window.getByRole('button', { name: 'Minimize' })).toBeVisible()
    await expect(window.getByRole('button', { name: 'Close' })).toBeVisible()

    if (process.env.ELECTRON_E2E_WINDOW_MANAGER !== 'none') {
      await maximizeButton.click()
      const restoreButton = window.getByRole('button', { name: 'Restore' })
      await expect(restoreButton).toBeVisible()
      await restoreButton.click()
      await expect(maximizeButton).toBeVisible()
    }
  }

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

  await expect(applicationVersion).toHaveText(packageVersion)
  await expect(electronVersion).toHaveText(/^\d+\.\d+\.\d+/)
  await expect(platform).toHaveText(/^\S+ \/ \S+$/)

  await applicationViewport.evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })
  await expect
    .poll(() => applicationViewport.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0)

  const exposedGlobals = await window.evaluate(() => ({
    bridge: 'app' in window,
    electron: 'ipcRenderer' in window,
    node: 'require' in window || 'process' in window,
  }))

  expect(exposedGlobals).toEqual({ bridge: true, electron: false, node: false })
}
