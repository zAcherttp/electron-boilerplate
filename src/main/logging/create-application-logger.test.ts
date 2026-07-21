import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { once } from 'node:events'
import pino from 'pino'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { createApplicationLogger } from './create-application-logger'

const logRecordSchema = z.object({
  appVersion: z.literal('1.2.3'),
  component: z.literal('main'),
  msg: z.literal('test event'),
  nested: z.object({ password: z.literal('[Redacted]') }),
  token: z.literal('[Redacted]'),
})

describe('createApplicationLogger', () => {
  it('writes structured records and redacts credential fields', async () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), 'electron-boilerplate-log-'))
    const logFile = join(temporaryDirectory, 'main.log')
    const destination = pino.destination({ dest: logFile, sync: true })

    try {
      const applicationLogger = createApplicationLogger({
        appVersion: '1.2.3',
        destination,
        isPackaged: true,
        logDirectory: temporaryDirectory,
      })

      applicationLogger.logger.info(
        {
          nested: { password: 'nested-secret' },
          token: 'top-level-secret',
        },
        'test event',
      )
      applicationLogger.flush()
      const destinationClosed = once(destination, 'close')
      destination.end()
      await destinationClosed

      const record = logRecordSchema.parse(JSON.parse(readFileSync(logFile, 'utf8')))

      expect(record).toMatchObject({
        appVersion: '1.2.3',
        component: 'main',
        nested: { password: '[Redacted]' },
        token: '[Redacted]',
      })
    } finally {
      rmSync(temporaryDirectory, { force: true, recursive: true })
    }
  })
})
