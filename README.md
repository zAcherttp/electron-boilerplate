# Electron Boilerplate

An incremental, opinionated desktop application foundation built around Electron, React, strict TypeScript, and a planned Hono Backend for Frontend (BFF).

The repository is being assembled one verified increment at a time. The current increment establishes one Vite entrypoint for the React renderer and Electron runtimes. Hono is deliberately not installed yet.

## Current foundation

- Electron 43 with a sandboxed, context-isolated renderer
- React 19 rendered by Vite 8
- TypeScript 7 in strict mode
- vite-plugin-doubleshot for Electron main, preload, and application startup
- electron-builder for ASAR packaging and Windows installers
- pnpm 11.15.1 pinned through `packageManager`
- one straightforward Vite command for development and production builds

Vite is the toolchain entrypoint. Doubleshot wires Electron main and preload builds into Vite while keeping their source and runtime boundaries explicit.

```text
.
├─ src/
│  ├─ contracts/
│  │  └─ desktop-api.ts
│  ├─ main/
│  │  ├─ index.ts
│  │  └─ tsconfig.json
│  ├─ preload/
│  │  ├─ index.ts
│  │  └─ tsconfig.json
│  └─ renderer/
│     ├─ App.tsx
│     ├─ index.html
│     ├─ main.tsx
│     ├─ styles.css
│     └─ tsconfig.json
├─ tsconfig.json
├─ electron-builder.yml
└─ vite.config.ts
```

## Requirements

- Node.js 22.18 or newer
- pnpm 11.15.1 (Corepack can select it from `package.json`)

## Development

```bash
pnpm install
pnpm dev
```

`pnpm dev` clears `dist`, starts Vite, builds main and preload, and launches Electron. Use `pnpm debug` for Doubleshot debug output.

## Checks and production run

```bash
pnpm typecheck
pnpm build
pnpm start
```

`pnpm start` runs the already-built production output, so run `pnpm build` first.

## Packaging

```bash
pnpm package
pnpm dist
```

`pnpm package` creates an unpacked application in `release/win-unpacked` for fast runtime checks. `pnpm dist` creates an unsigned NSIS installer and block map in `release/` without publishing them.

The packaging baseline intentionally uses Electron's default icon. Product identity, icons, signing, publishing, and auto-update configuration belong to later release-readiness increments.

## TypeScript 7 support

This foundation uses TypeScript 7.0.2 directly for project type-checking. Vite and Doubleshot handle transpilation. Tools that have not yet added TypeScript 7 support, especially lint integrations, will be evaluated when their increment is introduced rather than forcing a second compiler into this baseline.

## Architecture direction

The future embedded request flow is:

```text
React renderer
  → typed preload API
  → validated Electron IPC
  → Electron main
  → Hono app.request()
  → local data, filesystem, or remote APIs
```

Hono will run in memory without opening a localhost port. A separate Node adapter will allow the same BFF application to run as a standalone HTTP service.

## Plans

- [Full visual implementation plan](docs/plan.html)
- [Brief session-reload plan](docs/plan.md)

The Vite, TypeScript, and electron-builder foundations are verified. The next functional increment is a portable in-memory Hono BFF reached through validated Electron IPC; it will not open an HTTP port by default.
