import { describe, expect, it } from 'vitest'
import { createRendererUrlPolicy } from './renderer-url-policy'

describe('renderer URL policy', () => {
  it('trusts only the configured renderer authority', () => {
    const policy = createRendererUrlPolicy({
      rendererUrl: 'app://bundle/index.html',
      trustedExternalOrigins: [],
    })

    expect(policy.isTrustedRendererUrl('app://bundle/settings')).toBe(true)
    expect(policy.isTrustedRendererUrl('app://bundle.example/settings')).toBe(false)
    expect(policy.isTrustedRendererUrl('https://bundle/settings')).toBe(false)
    expect(policy.isTrustedRendererUrl('not a URL')).toBe(false)
  })

  it('supports the exact Vite development authority', () => {
    const policy = createRendererUrlPolicy({
      rendererUrl: 'http://127.0.0.1:5173/',
      trustedExternalOrigins: [],
    })

    expect(policy.isTrustedRendererUrl('http://127.0.0.1:5173/feature')).toBe(true)
    expect(policy.isTrustedRendererUrl('http://127.0.0.1:5174/feature')).toBe(false)
    expect(policy.isTrustedRendererUrl('http://localhost:5173/feature')).toBe(false)
  })

  it('denies external URLs until an HTTPS origin is explicitly configured', () => {
    const policy = createRendererUrlPolicy({
      rendererUrl: 'app://bundle/index.html',
      trustedExternalOrigins: [],
    })

    expect(policy.isTrustedExternalUrl('https://example.com/docs')).toBe(false)
  })

  it('matches configured external origins without prefix or credential bypasses', () => {
    const policy = createRendererUrlPolicy({
      rendererUrl: 'app://bundle/index.html',
      trustedExternalOrigins: ['https://docs.example.com'],
    })

    expect(policy.isTrustedExternalUrl('https://docs.example.com/guide')).toBe(true)
    expect(policy.isTrustedExternalUrl('https://docs.example.com.evil.test/guide')).toBe(false)
    expect(policy.isTrustedExternalUrl('https://user@docs.example.com/guide')).toBe(false)
    expect(policy.isTrustedExternalUrl('http://docs.example.com/guide')).toBe(false)
  })

  it('rejects non-HTTPS external origin configuration', () => {
    expect(() =>
      createRendererUrlPolicy({
        rendererUrl: 'app://bundle/index.html',
        trustedExternalOrigins: ['http://docs.example.com'],
      }),
    ).toThrow('External origins must use HTTPS')
  })
})
