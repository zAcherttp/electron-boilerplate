import { describe, expect, it } from 'vitest'
import { applicationWindowStateSchema } from './application-window'

describe('application window state contract', () => {
  it('accepts the complete main-owned state', () => {
    expect(
      applicationWindowStateSchema.parse({
        appName: 'Electron Boilerplate',
        isFocused: true,
        isMaximized: false,
        usesNativeControls: false,
      }),
    ).toEqual({
      appName: 'Electron Boilerplate',
      isFocused: true,
      isMaximized: false,
      usesNativeControls: false,
    })
  })

  it('rejects an incomplete application identity', () => {
    expect(
      applicationWindowStateSchema.safeParse({
        appName: '',
        isFocused: true,
        isMaximized: false,
        usesNativeControls: false,
      }).success,
    ).toBe(false)
  })
})
