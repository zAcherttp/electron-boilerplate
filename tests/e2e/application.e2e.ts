import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { test } from '@playwright/test'
import { _electron as electron } from 'playwright'
import { assertApplicationWindow } from './assert-application-window'

const projectRoot = resolve(__dirname, '../..')

test('launches the production renderer through the secure desktop bridge', async () => {
  const userDataDirectory = mkdtempSync(resolve(tmpdir(), 'electron-boilerplate-e2e-'))
  const launchApplication = () =>
    electron.launch({
      args: ['.', `--user-data-dir=${userDataDirectory}`],
      cwd: projectRoot,
    })
  let electronApp = await launchApplication()

  try {
    const firstWindow = await electronApp.firstWindow()
    await assertApplicationWindow(firstWindow)

    await firstWindow.getByRole('button', { name: /^Appearance:/ }).click()
    await firstWindow.getByRole('menuitemradio', { name: 'Dark' }).click()
    await firstWindow.getByRole('button', { name: 'Appearance: Dark' }).waitFor()
    await firstWindow.locator('html.dark').waitFor()

    if (process.platform === 'darwin') {
      await electronApp.close()
    } else {
      const firstWindowClosed = firstWindow.waitForEvent('close')
      await firstWindow.getByRole('button', { name: 'Close' }).click()
      await firstWindowClosed
      await electronApp.close()
    }

    electronApp = await launchApplication()
    const secondWindow = await electronApp.firstWindow()
    await secondWindow.getByRole('button', { name: 'Appearance: Dark' }).waitFor()
    await secondWindow.locator('html.dark').waitFor()

    await secondWindow.getByRole('button', { name: 'Appearance: Dark' }).click()
    await secondWindow.getByRole('menuitemradio', { name: 'System' }).click()
    await secondWindow.getByRole('button', { name: 'Appearance: System' }).waitFor()
  } finally {
    await electronApp.close()
    rmSync(userDataDirectory, { force: true, recursive: true })
  }
})
