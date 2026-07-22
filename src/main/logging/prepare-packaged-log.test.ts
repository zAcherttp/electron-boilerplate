import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { preparePackagedLog } from './prepare-packaged-log'

describe('preparePackagedLog', () => {
  it('rotates a full log and retains only the configured archives', () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), 'electron-boilerplate-log-rotation-'))
    const activeLog = join(temporaryDirectory, 'main.log')
    writeFileSync(activeLog, 'active', 'utf8')
    writeFileSync(join(temporaryDirectory, 'main.1.log'), 'first', 'utf8')
    writeFileSync(join(temporaryDirectory, 'main.2.log'), 'second', 'utf8')
    writeFileSync(join(temporaryDirectory, 'main.3.log'), 'oldest', 'utf8')

    try {
      const result = preparePackagedLog({
        fileName: 'main.log',
        logDirectory: temporaryDirectory,
        maxFileBytes: 6,
        retainedArchiveCount: 3,
      })

      expect(result).toEqual({ filePath: activeLog, rotatedAtStartup: true })
      expect(readFileSync(join(temporaryDirectory, 'main.1.log'), 'utf8')).toBe('active')
      expect(readFileSync(join(temporaryDirectory, 'main.2.log'), 'utf8')).toBe('first')
      expect(readFileSync(join(temporaryDirectory, 'main.3.log'), 'utf8')).toBe('second')
    } finally {
      rmSync(temporaryDirectory, { force: true, recursive: true })
    }
  })

  it('keeps a log below the rotation threshold in place', () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), 'electron-boilerplate-log-current-'))
    const activeLog = join(temporaryDirectory, 'main.log')
    writeFileSync(activeLog, 'current', 'utf8')

    try {
      expect(
        preparePackagedLog({
          fileName: 'main.log',
          logDirectory: temporaryDirectory,
          maxFileBytes: 8,
          retainedArchiveCount: 3,
        }),
      ).toEqual({ filePath: activeLog, rotatedAtStartup: false })
      expect(readFileSync(activeLog, 'utf8')).toBe('current')
    } finally {
      rmSync(temporaryDirectory, { force: true, recursive: true })
    }
  })
})
