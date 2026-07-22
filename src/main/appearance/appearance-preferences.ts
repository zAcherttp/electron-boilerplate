import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { z } from 'zod'
import { themeSourceSchema, type ThemeSource } from '../../contracts/appearance'

const appearancePreferencesSchema = z.object({
  themeSource: themeSourceSchema,
  version: z.literal(1),
})

export interface AppearancePreferences {
  themeSource: ThemeSource
  version: 1
}

export interface AppearancePreferencesReadResult {
  preferences: AppearancePreferences
  status: 'default' | 'loaded' | 'recovered'
}

export const defaultAppearancePreferences: AppearancePreferences = {
  themeSource: 'system',
  version: 1,
}

export function readAppearancePreferences(filePath: string): AppearancePreferencesReadResult {
  if (!existsSync(filePath))
    return {
      preferences: defaultAppearancePreferences,
      status: 'default',
    }

  try {
    return {
      preferences: appearancePreferencesSchema.parse(JSON.parse(readFileSync(filePath, 'utf8'))),
      status: 'loaded',
    }
  } catch {
    return {
      preferences: defaultAppearancePreferences,
      status: 'recovered',
    }
  }
}

export function writeAppearancePreferences(
  filePath: string,
  preferences: AppearancePreferences,
): void {
  const parsedPreferences = appearancePreferencesSchema.parse(preferences)
  const temporaryFilePath = `${filePath}.${process.pid}.tmp`

  mkdirSync(dirname(filePath), { recursive: true })

  try {
    writeFileSync(temporaryFilePath, `${JSON.stringify(parsedPreferences, null, 2)}\n`, 'utf8')
    renameSync(temporaryFilePath, filePath)
  } finally {
    rmSync(temporaryFilePath, { force: true })
  }
}
