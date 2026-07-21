import { join } from 'node:path'
import pino, { type DestinationStream, type Logger } from 'pino'

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

interface CreateApplicationLoggerOptions {
  appVersion: string
  destination?: DestinationStream
  isPackaged: boolean
  logDirectory: string
}

export interface ApplicationLogger {
  filePath: string | null
  flush: () => void
  logger: Logger
}

export function createApplicationLogger(
  options: CreateApplicationLoggerOptions,
): ApplicationLogger {
  const filePath = options.isPackaged ? join(options.logDirectory, 'main.log') : null
  const destination =
    options.destination ??
    pino.destination({
      dest: filePath ?? 1,
      mkdir: filePath !== null,
      sync: false,
    })
  const logger = pino(
    {
      base: {
        appVersion: options.appVersion,
        component: 'main',
        pid: process.pid,
      },
      level: options.isPackaged ? 'info' : 'debug',
      redact: {
        censor: '[Redacted]',
        paths: redactedFields,
      },
      serializers: {
        err: pino.stdSerializers.err,
      },
    },
    destination,
  )

  return {
    filePath,
    flush: () => logger.flush(),
    logger,
  }
}
