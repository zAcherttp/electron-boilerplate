const toolchain = ['Electron', 'Vite', 'React', 'TypeScript 7']

export function App() {
  const { versions } = window.desktop

  return (
    <main className="app-shell">
      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">Foundation increment</p>
        <h1 id="page-title">A small, explicit Electron stack.</h1>
        <p className="lede">
          The renderer now runs on React and Vite. Electron main and preload are
          strict TypeScript, compiled independently with tsdown.
        </p>

        <ul className="toolchain" aria-label="Active toolchain">
          {toolchain.map(tool => <li key={tool}>{tool}</li>)}
        </ul>
      </section>

      <section className="runtime" aria-labelledby="runtime-title">
        <div>
          <p className="eyebrow">Runtime check</p>
          <h2 id="runtime-title">Bridge connected.</h2>
        </div>

        <dl>
          <div>
            <dt>Electron</dt>
            <dd>{versions.electron}</dd>
          </div>
          <div>
            <dt>Chromium</dt>
            <dd>{versions.chrome}</dd>
          </div>
          <div>
            <dt>Node.js</dt>
            <dd>{versions.node}</dd>
          </div>
        </dl>
      </section>
    </main>
  )
}
