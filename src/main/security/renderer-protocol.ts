import { pathToFileURL } from 'node:url'
import { net, protocol } from 'electron'
import { rendererScheme } from './renderer-location'
import { resolveRendererAssetPath } from './resolve-renderer-asset-path'

export { rendererUrl } from './renderer-location'
const productionContentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
].join('; ')

export function registerRendererScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: rendererScheme,
      privileges: {
        codeCache: true,
        secure: true,
        standard: true,
        supportFetchAPI: true,
      },
    },
  ])
}

export function registerRendererProtocol(rendererRoot: string): () => void {
  protocol.handle(rendererScheme, async (request) => {
    const assetPath = resolveRendererAssetPath(rendererRoot, request.url)

    if (assetPath === null) return new Response(null, { status: 404 })

    let response: Response

    try {
      response = await net.fetch(pathToFileURL(assetPath).toString())
    } catch {
      return new Response(null, { status: 404 })
    }

    if (!assetPath.endsWith('.html')) return response

    const headers = new Headers(response.headers)
    headers.set('Content-Security-Policy', productionContentSecurityPolicy)

    return new Response(response.body, {
      headers,
      status: response.status,
      statusText: response.statusText,
    })
  })

  return () => protocol.unhandle(rendererScheme)
}
