import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { resolveRendererAssetPath } from './resolve-renderer-asset-path'

const rendererRoot = resolve('dist/renderer')

describe('renderer asset path resolution', () => {
  it('maps the renderer root to index.html', () => {
    expect(resolveRendererAssetPath(rendererRoot, 'app://bundle/'))
      .toBe(resolve(rendererRoot, 'index.html'))
  })

  it('maps assets inside the renderer root', () => {
    expect(resolveRendererAssetPath(rendererRoot, 'app://bundle/assets/main.js?v=1'))
      .toBe(resolve(rendererRoot, 'assets/main.js'))
  })

  it('rejects another scheme or host', () => {
    expect(resolveRendererAssetPath(rendererRoot, 'https://bundle/index.html')).toBeNull()
    expect(resolveRendererAssetPath(rendererRoot, 'app://other/index.html')).toBeNull()
  })

  it('rejects malformed and escaping paths', () => {
    expect(resolveRendererAssetPath(rendererRoot, 'not a URL')).toBeNull()
    expect(resolveRendererAssetPath(rendererRoot, 'app://bundle/%E0%A4%A')).toBeNull()
    expect(resolveRendererAssetPath(rendererRoot, 'app://bundle/%5C..%5Csecret.txt')).toBeNull()
  })
})
