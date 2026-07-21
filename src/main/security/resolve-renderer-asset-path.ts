import { isAbsolute, relative, resolve } from 'node:path'
import { rendererHost, rendererScheme } from './renderer-location'

export function resolveRendererAssetPath(rendererRoot: string, requestUrl: string): string | null {
  let parsedUrl: URL

  try {
    parsedUrl = new URL(requestUrl)
  }
  catch {
    return null
  }

  if (
    parsedUrl.protocol !== `${rendererScheme}:`
    || parsedUrl.host !== rendererHost
    || parsedUrl.username !== ''
    || parsedUrl.password !== ''
  ) {
    return null
  }

  let pathname: string

  try {
    pathname = decodeURIComponent(parsedUrl.pathname)
  }
  catch {
    return null
  }

  if (pathname.includes('\0') || pathname.includes('\\'))
    return null

  const assetPath = resolve(rendererRoot, pathname === '/' ? 'index.html' : pathname.slice(1))
  const relativeAssetPath = relative(rendererRoot, assetPath)

  if (relativeAssetPath.startsWith('..') || isAbsolute(relativeAssetPath))
    return null

  return assetPath
}
