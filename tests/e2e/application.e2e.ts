import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'
import { _electron as electron } from 'playwright'

const projectRoot = resolve(__dirname, '../..')

test('launches the production renderer through the secure desktop bridge', async () => {
  const electronApp = await electron.launch({
    args: ['.'],
    cwd: projectRoot,
  })

  try {
    const window = await electronApp.firstWindow()

    await expect(window).toHaveURL('app://bundle/index.html')
    await expect(window.getByRole('heading', {
      name: 'A small, explicit Electron stack.',
    })).toBeVisible()
    const electronVersion = window.locator('.runtime dl > div')
      .filter({ has: window.getByText('Electron', { exact: true }) })
      .locator('dd')
    const platform = window.locator('.runtime dl > div')
      .filter({ has: window.getByText('Platform', { exact: true }) })
      .locator('dd')

    await expect(electronVersion).toHaveText(/^\d+\.\d+\.\d+/)
    await expect(platform).toHaveText(/^\S+ \/ \S+$/)

    const exposedGlobals = await window.evaluate(() => ({
      bridge: 'app' in window,
      electron: 'ipcRenderer' in window,
      node: 'require' in window || 'process' in window,
    }))

    expect(exposedGlobals).toEqual({ bridge: true, electron: false, node: false })
  }
  finally {
    await electronApp.close()
  }
})
