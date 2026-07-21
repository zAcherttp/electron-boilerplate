import { resolve } from 'node:path'
import { test } from '@playwright/test'
import { _electron as electron } from 'playwright'
import { assertApplicationWindow } from './assert-application-window'

const projectRoot = resolve(__dirname, '../..')

test('launches the production renderer through the secure desktop bridge', async () => {
  const electronApp = await electron.launch({
    args: ['.'],
    cwd: projectRoot,
  })

  try {
    const window = await electronApp.firstWindow()
    await assertApplicationWindow(window)
  } finally {
    await electronApp.close()
  }
})
