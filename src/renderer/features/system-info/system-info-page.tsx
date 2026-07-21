import { Alert } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { Skeleton } from '../../components/ui/skeleton'
import { useSystemInfoQuery } from './system-info-query'

const toolchain = [
  'Electron',
  'Vite',
  'React',
  'Hono',
  'TanStack Router',
  'TanStack Query',
  'Zod',
  'TypeScript 7',
]

export function SystemInfoPage() {
  const systemInfoQuery = useSystemInfoQuery()

  return (
    <main className="app-shell">
      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">Renderer foundation</p>
        <h1 id="page-title">A small, explicit Electron stack.</h1>
        <p className="lede">
          Typed routes and feature-owned queries sit on top of the portable Hono API. No localhost
          server is running.
        </p>

        <ul className="toolchain" aria-label="Active toolchain">
          {toolchain.map((tool) => (
            <li key={tool}>{tool}</li>
          ))}
        </ul>
      </section>

      <section className="runtime" aria-labelledby="runtime-title">
        <div>
          <p className="eyebrow">Runtime check</p>
          <h2 id="runtime-title">Application API</h2>
        </div>

        <div className="runtime-result" aria-live="polite">
          {systemInfoQuery.isPending && (
            <div className="runtime-skeletons">
              <Skeleton label="Loading application version" />
              <Skeleton label="Loading platform information" />
              <Skeleton label="Loading runtime versions" />
            </div>
          )}

          {systemInfoQuery.isError && (
            <Alert title="System information is unavailable">
              <p>The desktop bridge did not complete the request.</p>
              <Button onClick={() => void systemInfoQuery.refetch()}>Try again</Button>
            </Alert>
          )}

          {systemInfoQuery.data && (
            <dl>
              <div>
                <dt>Application</dt>
                <dd>{systemInfoQuery.data.appVersion}</dd>
              </div>
              <div>
                <dt>Platform</dt>
                <dd>
                  {systemInfoQuery.data.platform} / {systemInfoQuery.data.architecture}
                </dd>
              </div>
              <div>
                <dt>Electron</dt>
                <dd>{systemInfoQuery.data.runtimeVersions.electron}</dd>
              </div>
              <div>
                <dt>Chromium</dt>
                <dd>{systemInfoQuery.data.runtimeVersions.chrome}</dd>
              </div>
              <div>
                <dt>Node.js</dt>
                <dd>{systemInfoQuery.data.runtimeVersions.node}</dd>
              </div>
            </dl>
          )}
        </div>
      </section>
    </main>
  )
}
