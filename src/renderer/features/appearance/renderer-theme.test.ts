// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest'
import { applyRendererTheme } from './renderer-theme'

afterEach(() => {
  document.documentElement.classList.remove('dark')
  document.documentElement.style.removeProperty('color-scheme')
})

describe('renderer theme', () => {
  it('applies and removes the shadcn dark-mode selector', () => {
    applyRendererTheme(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.style.colorScheme).toBe('dark')

    applyRendererTheme(false)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.style.colorScheme).toBe('light')
  })
})
