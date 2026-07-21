interface RendererUrlPolicyOptions {
  rendererUrl: string
  trustedExternalOrigins: string[]
}

export interface RendererUrlPolicy {
  isTrustedExternalUrl: (url: string) => boolean
  isTrustedRendererUrl: (url: string) => boolean
}

interface UrlAuthority {
  host: string
  protocol: string
}

function readUrl(url: string): URL | null {
  try {
    return new URL(url)
  } catch {
    return null
  }
}

function readAuthority(url: string): UrlAuthority {
  const parsedUrl = readUrl(url)

  if (parsedUrl === null || parsedUrl.username !== '' || parsedUrl.password !== '')
    throw new Error(`Invalid trusted URL: ${url}`)

  return {
    host: parsedUrl.host,
    protocol: parsedUrl.protocol,
  }
}

function hasAuthority(url: URL, authority: UrlAuthority): boolean {
  return (
    url.username === '' &&
    url.password === '' &&
    url.protocol === authority.protocol &&
    url.host === authority.host
  )
}

export function createRendererUrlPolicy(options: RendererUrlPolicyOptions): RendererUrlPolicy {
  const rendererAuthority = readAuthority(options.rendererUrl)
  const externalAuthorities = options.trustedExternalOrigins.map((origin) => {
    const authority = readAuthority(origin)

    if (authority.protocol !== 'https:')
      throw new Error(`External origins must use HTTPS: ${origin}`)

    return authority
  })

  return {
    isTrustedExternalUrl: (url) => {
      const parsedUrl = readUrl(url)

      return (
        parsedUrl !== null &&
        parsedUrl.protocol === 'https:' &&
        externalAuthorities.some((authority) => hasAuthority(parsedUrl, authority))
      )
    },
    isTrustedRendererUrl: (url) => {
      const parsedUrl = readUrl(url)
      return parsedUrl !== null && hasAuthority(parsedUrl, rendererAuthority)
    },
  }
}
