import { closeSync, existsSync, mkdirSync, openSync, renameSync, rmSync, statSync } from 'node:fs'
import { join, parse } from 'node:path'

export const packagedLogFileName = 'main.log'

/** Five MiB keeps low-volume desktop diagnostics useful without allowing indefinite growth. */
export const packagedLogMaxFileBytes = 5 * 1024 * 1024

/** Three archives plus the active file cap the normal retained footprint near twenty MiB. */
export const packagedLogRetainedArchiveCount = 3

interface PreparePackagedLogOptions {
  fileName: string
  logDirectory: string
  maxFileBytes: number
  retainedArchiveCount: number
}

export interface PreparedPackagedLog {
  filePath: string
  rotatedAtStartup: boolean
}

function archivePath(filePath: string, index: number): string {
  const path = parse(filePath)
  return join(path.dir, `${path.name}.${index}${path.ext}`)
}

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 1) throw new Error(`${name} must be a positive integer`)
}

export function preparePackagedLog(options: PreparePackagedLogOptions): PreparedPackagedLog {
  assertPositiveInteger(options.maxFileBytes, 'maxFileBytes')
  assertPositiveInteger(options.retainedArchiveCount, 'retainedArchiveCount')

  mkdirSync(options.logDirectory, { recursive: true })
  const filePath = join(options.logDirectory, options.fileName)
  const descriptor = openSync(filePath, 'a')
  closeSync(descriptor)

  if (statSync(filePath).size < options.maxFileBytes) return { filePath, rotatedAtStartup: false }

  const oldestArchive = archivePath(filePath, options.retainedArchiveCount)
  if (existsSync(oldestArchive)) rmSync(oldestArchive)

  for (let index = options.retainedArchiveCount - 1; index >= 1; index -= 1) {
    const source = archivePath(filePath, index)
    if (existsSync(source)) renameSync(source, archivePath(filePath, index + 1))
  }

  renameSync(filePath, archivePath(filePath, 1))
  return { filePath, rotatedAtStartup: true }
}
