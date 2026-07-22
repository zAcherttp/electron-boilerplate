import { once } from 'node:events'
import pino, { type DestinationStream, type Logger } from 'pino'
import { createDevelopmentLogDestination } from './create-development-log-destination'
import {
  packagedLogFileName,
  packagedLogMaxFileBytes,
  packagedLogRetainedArchiveCount,
  preparePackagedLog,
} from './prepare-packaged-log'

const redactedFields = [
  'accessToken',
  'authorization',
  'cookie',
  'password',
  'refreshToken',
  'token',
  '*.accessToken',
  '*.authorization',
  '*.cookie',
  '*.password',
  '*.refreshToken',
  '*.token',
]

type CreateApplicationLoggerOptions =
  | { appVersion: string; destination: number | string; mode: 'development' }
  | { appVersion: string; logDirectory: string; mode: 'packaged' }

export type ApplicationLogStorage =
  | {
      filePath: string
      kind: 'file'
      maxFileBytes: number
      retainedArchiveCount: number
      rotatedAtStartup: boolean
    }
  | { filePath: null; kind: 'stderr'; reason: string }
  | { filePath: null; kind: 'stdout' }

export interface ApplicationLogger {
  close: () => Promise<void>
  flush: () => void
  logger: Logger
  storage: ApplicationLogStorage
}

interface LoggerDestination {
  close: () => Promise<void>
  destination: DestinationStream
  flush: () => void
  storage: ApplicationLogStorage
}

function createLoggerDestination(options: CreateApplicationLoggerOptions): LoggerDestination {
  if (options.mode === 'development') {
    const destination = createDevelopmentLogDestination(options.destination)
    destination.on('error', (error: Error) => {
      process.stderr.write(`[logging] development destination failure: ${error.message}\n`)
    })
    let destinationClosed = false

    return {
      close: async () => {
        if (typeof options.destination !== 'string' || destinationClosed) return
        destinationClosed = true
        const closed = once(destination, 'close')
        destination.end()
        await closed
      },
      destination,
      flush: () => {},
      storage: { filePath: null, kind: 'stdout' },
    }
  }

  try {
    const preparedLog = preparePackagedLog({
      fileName: packagedLogFileName,
      logDirectory: options.logDirectory,
      maxFileBytes: packagedLogMaxFileBytes,
      retainedArchiveCount: packagedLogRetainedArchiveCount,
    })

    const destination = pino.destination({ dest: preparedLog.filePath, sync: true })
    destination.on('error', (error: Error) => {
      process.stderr.write(`[logging] packaged destination failure: ${error.message}\n`)
    })
    let destinationClosed = false

    return {
      close: async () => {
        if (destinationClosed) return
        destinationClosed = true
        destination.flushSync()
        const closed = once(destination, 'close')
        destination.end()
        await closed
      },
      destination,
      flush: () => destination.flushSync(),
      storage: {
        filePath: preparedLog.filePath,
        kind: 'file',
        maxFileBytes: packagedLogMaxFileBytes,
        retainedArchiveCount: packagedLogRetainedArchiveCount,
        rotatedAtStartup: preparedLog.rotatedAtStartup,
      },
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Non-Error logging failure'
    const destination = pino.destination(2)
    destination.on('error', (destinationError: Error) => {
      process.stderr.write(`[logging] fallback destination failure: ${destinationError.message}\n`)
    })
    return {
      close: async () => {},
      destination,
      flush: () => destination.flushSync(),
      storage: { filePath: null, kind: 'stderr', reason },
    }
  }
}

export function createApplicationLogger(
  options: CreateApplicationLoggerOptions,
): ApplicationLogger {
  const destination = createLoggerDestination(options)
  const logger = pino(
    {
      base: {
        appVersion: options.appVersion,
        component: 'main',
        pid: process.pid,
      },
      level: options.mode === 'packaged' ? 'info' : 'debug',
      redact: {
        censor: '[Redacted]',
        paths: redactedFields,
      },
      serializers: {
        err: pino.stdSerializers.err,
      },
    },
    destination.destination,
  )
  const flush = () => {
    if (options.mode === 'packaged') logger.flush()
    destination.flush()
  }

  return {
    close: async () => {
      flush()
      await destination.close()
    },
    flush,
    logger,
    storage: destination.storage,
  }
}
