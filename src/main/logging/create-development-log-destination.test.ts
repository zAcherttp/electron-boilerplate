import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { once } from 'node:events'
import pino from 'pino'
import { describe, expect, it } from 'vitest'
import { createDevelopmentLogDestination } from './create-development-log-destination'

describe('createDevelopmentLogDestination', () => {
  it('renders a compact human-readable lifecycle record', async () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), 'electron-boilerplate-pretty-log-'))
    const outputFile = join(temporaryDirectory, 'development.log')
    const destination = createDevelopmentLogDestination(outputFile)
    const logger = pino(
      {
        base: { appVersion: '1.2.3', component: 'main', pid: 14724 },
      },
      destination,
    )

    try {
      logger.info({ mode: 'development' }, 'application ready')
      const destinationClosed = once(destination, 'close')
      destination.end()
      await destinationClosed

      const output = readFileSync(outputFile, 'utf8')
      expect(output).toMatch(
        /^\[\d{2}\/\d{2}\/\d{4}, \d{1,2}:\d{2}:\d{2} (?:AM|PM)\] INFO \(14724\): \[Electron\] \[main\] application ready/,
      )
      expect(output).toContain('"mode":"development"')
      expect(output).not.toContain('appVersion')
    } finally {
      rmSync(temporaryDirectory, { force: true, recursive: true })
    }
  })
})
