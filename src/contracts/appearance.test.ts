import type { ThemeSource } from './appearance'
import { describe, expect, it } from 'vitest'
import { appearanceStateSchema, themeSourceSchema } from './appearance'

const themeSources: ThemeSource[] = ['system', 'light', 'dark']

describe('appearance contract', () => {
  it.each(themeSources)('accepts the %s theme source', (source) => {
    expect(themeSourceSchema.parse(source)).toBe(source)
  })

  it('accepts a resolved main-owned appearance state', () => {
    expect(appearanceStateSchema.parse({ resolved: 'dark', source: 'system' })).toEqual({
      resolved: 'dark',
      source: 'system',
    })
  })

  it('rejects unsupported theme sources', () => {
    expect(themeSourceSchema.safeParse('automatic').success).toBe(false)
  })
})
