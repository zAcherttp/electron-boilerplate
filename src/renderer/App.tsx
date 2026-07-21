import type { SystemInfo } from '../contracts/system-info'
import { useEffect, useState } from 'react'

const toolchain = ['Electron', 'Vite', 'React', 'Hono', 'Zod', 'TypeScript 7']

type SystemInfoState =
  | { status: 'error', message: string }
  | { status: 'loading' }
  | { status: 'ready', systemInfo: SystemInfo }

export function App() {
  const [systemInfoState, setSystemInfoState] = useState<SystemInfoState>({ status: 'loading' })

  useEffect(() => {
    let isCurrent = true

    void window.app.system.getInfo()
      .then((systemInfo) => {
        if (isCurrent)
          setSystemInfoState({ status: 'ready', systemInfo })
      })
      .catch(() => {
        if (isCurrent) {
          setSystemInfoState({
            status: 'error',
            message: 'The application API request failed.',
          })
        }
      })

    return () => {
      isCurrent = false
    }
  }, [])

  return (
    <main className="app-shell">
      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">Application API increment</p>
        <h1 id="page-title">A small, explicit Electron stack.</h1>
        <p className="lede">
          React talks to a portable Hono API through a narrow, validated Electron
          bridge. No localhost server is running.
        </p>

        <ul className="toolchain" aria-label="Active toolchain">
          {toolchain.map(tool => <li key={tool}>{tool}</li>)}
        </ul>
      </section>

      <section className="runtime" aria-labelledby="runtime-title">
        <div>
          <p className="eyebrow">Runtime check</p>
          <h2 id="runtime-title">API connected.</h2>
        </div>

        <div className="runtime-result" aria-live="polite">
          {systemInfoState.status === 'loading' && <p>Loading through the API…</p>}

          {systemInfoState.status === 'error' && (
            <p className="runtime-error" role="alert">{systemInfoState.message}</p>
          )}

          {systemInfoState.status === 'ready' && (
            <dl>
              <div>
                <dt>Application</dt>
                <dd>{systemInfoState.systemInfo.appVersion}</dd>
              </div>
              <div>
                <dt>Platform</dt>
                <dd>{systemInfoState.systemInfo.platform} / {systemInfoState.systemInfo.architecture}</dd>
              </div>
              <div>
                <dt>Electron</dt>
                <dd>{systemInfoState.systemInfo.runtimeVersions.electron}</dd>
              </div>
              <div>
                <dt>Chromium</dt>
                <dd>{systemInfoState.systemInfo.runtimeVersions.chrome}</dd>
              </div>
              <div>
                <dt>Node.js</dt>
                <dd>{systemInfoState.systemInfo.runtimeVersions.node}</dd>
              </div>
            </dl>
          )}
        </div>
      </section>
    </main>
  )
}
