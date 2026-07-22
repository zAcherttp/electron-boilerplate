import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
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

    try {
      const applicationLogger = createApplicationLogger({
        appVersion: '1.2.3',
        logDirectory: temporaryDirectory,
        mode: 'packaged',
      })

      applicationLogger.logger.info(
        {
          nested: { password: 'nested-secret' },
          token: 'top-level-secret',
        },
        'test event',
      )
      await applicationLogger.close()

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

  it('falls back to stderr when the packaged log directory cannot be created', async () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), 'electron-boilerplate-log-failure-'))
    const invalidLogDirectory = join(temporaryDirectory, 'not-a-directory')
    writeFileSync(invalidLogDirectory, 'occupied by a file', 'utf8')

    try {
      const applicationLogger = createApplicationLogger({
        appVersion: '1.2.3',
        logDirectory: invalidLogDirectory,
        mode: 'packaged',
      })

      expect(applicationLogger.storage).toMatchObject({
        filePath: null,
        kind: 'stderr',
      })
      await applicationLogger.close()
    } finally {
      rmSync(temporaryDirectory, { force: true, recursive: true })
    }
  })
})
