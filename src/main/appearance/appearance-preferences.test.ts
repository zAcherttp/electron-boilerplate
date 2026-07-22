import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  defaultAppearancePreferences,
  readAppearancePreferences,
  writeAppearancePreferences,
} from './appearance-preferences'

const testDirectories: string[] = []

afterEach(() => {
  for (const directory of testDirectories.splice(0))
    rmSync(directory, { force: true, recursive: true })
})

function createPreferencesPath(): string {
  const directory = mkdtempSync(join(tmpdir(), 'electron-boilerplate-appearance-'))
  testDirectories.push(directory)
  return join(directory, 'nested', 'appearance.json')
}

describe('appearance preferences', () => {
  it('uses the system theme when no preference exists', () => {
    expect(readAppearancePreferences(createPreferencesPath())).toEqual({
      preferences: defaultAppearancePreferences,
      status: 'default',
    })
  })

  it('writes and replaces validated preferences', () => {
    const filePath = createPreferencesPath()

    writeAppearancePreferences(filePath, { themeSource: 'dark', version: 1 })
    writeAppearancePreferences(filePath, { themeSource: 'light', version: 1 })

    expect(readAppearancePreferences(filePath)).toEqual({
      preferences: { themeSource: 'light', version: 1 },
      status: 'loaded',
    })
    expect(JSON.parse(readFileSync(filePath, 'utf8'))).toEqual({
      themeSource: 'light',
      version: 1,
    })
  })

  it('recovers from malformed preferences', () => {
    const filePath = createPreferencesPath()
    mkdirSync(dirname(filePath), { recursive: true })
    writeFileSync(filePath, '{"themeSource":"sepia"}', 'utf8')

    expect(readAppearancePreferences(filePath)).toEqual({
      preferences: defaultAppearancePreferences,
      status: 'recovered',
    })
  })
})
