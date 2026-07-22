import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { dirname, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { expect, test } from '@playwright/test'
import { chromium, type Browser } from 'playwright'
import { z } from 'zod'
import { assertApplicationWindow } from './assert-application-window'

const projectRoot = resolve(__dirname, '../..')
const executablePath = resolve(projectRoot, 'release', 'win-unpacked', 'electron-boilerplate.exe')
const packagedStartupRecordSchema = z.object({
  logging: z.object({
    filePath: z.string(),
    kind: z.literal('file'),
    maxFileBytes: z.literal(5 * 1024 * 1024),
    retainedArchiveCount: z.literal(3),
    rotatedAtStartup: z.boolean(),
  }),
  msg: z.literal('application starting'),
})

function readPackagedStartupRecord(logFilePath: string) {
  if (!existsSync(logFilePath)) return null

  const content = readFileSync(logFilePath, 'utf8').trim()
  if (!content) return null

  for (const line of content.split('\n').reverse()) {
    const record = packagedStartupRecordSchema.safeParse(JSON.parse(line))
    if (record.success) return record.data
  }

  return null
}

function getAvailablePort(): Promise<number> {
  return new Promise((resolvePort, reject) => {
    const server = createServer()

    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()

      if (address === null || typeof address === 'string') {
        server.close()
        reject(new Error('Could not allocate a Chromium debugging port'))
        return
      }

      server.close((error) => {
        if (error) reject(error)
        else resolvePort(address.port)
      })
    })
  })
}

async function connectToPackagedApplication(port: number): Promise<Browser> {
  const endpoint = `http://127.0.0.1:${port}`
  const deadline = Date.now() + 15_000

  while (Date.now() < deadline) {
    try {
      return await chromium.connectOverCDP(endpoint)
    } catch {
      await delay(100)
    }
  }

  throw new Error(`Packaged application did not expose its renderer at ${endpoint}`)
}

test('launches the packaged Windows application and completes the vertical slice', async () => {
  const port = await getAvailablePort()
  const profilePath = resolve(projectRoot, 'test-results', 'packaged-profile')
  const logFilePath = resolve(profilePath, 'logs', 'main.log')
  const packagedApplication = spawn(
    executablePath,
    [`--remote-debugging-port=${port}`, `--user-data-dir=${profilePath}`],
    {
      cwd: dirname(executablePath),
      stdio: 'ignore',
      windowsHide: true,
    },
  )
  let browser: Browser | null = null

  try {
    browser = await connectToPackagedApplication(port)
    const context = browser.contexts()[0]

    if (!context) throw new Error('Packaged application did not create a browser context')

    const window = context.pages()[0] ?? (await context.waitForEvent('page'))

    await assertApplicationWindow(window)
    await expect.poll(() => readPackagedStartupRecord(logFilePath)).not.toBeNull()
    expect(readPackagedStartupRecord(logFilePath)?.logging).toMatchObject({
      filePath: logFilePath,
      kind: 'file',
      maxFileBytes: 5 * 1024 * 1024,
      retainedArchiveCount: 3,
    })
    await expect
      .poll(() => readFileSync(logFilePath, 'utf8').includes('"msg":"application ready"'))
      .toBe(true)
  } finally {
    await browser?.close()
    if (packagedApplication.exitCode === null) packagedApplication.kill()
  }
})
