# Electron Boilerplate

An incremental, opinionated desktop application foundation built around Electron, React, strict TypeScript, and a Hono Backend for Frontend (BFF).

The repository currently contains the cleaned minimal Electron baseline. We are implementing the architecture one verified increment at a time instead of introducing the entire stack at once.

## Planned stack

- pnpm workspace
- Electron
- Vite + React
- strict TypeScript
- tsdown
- Hono BFF with Zod contracts
- TanStack Router and TanStack Query
- electron-builder
- Vitest and Playwright

Vite will build only the renderer. Electron main, preload, the Hono BFF, and the standalone server adapter will use explicit tsdown builds.

## Current baseline

This first increment intentionally remains plain JavaScript. It removes the inherited template automation and identity, and places runtime source files under `src/` before the workspace and TypeScript migration begins.

```text
.
├─ docs/
│  ├─ plan.html
│  └─ plan.md
├─ src/
│  ├─ main.js
│  ├─ preload.js
│  ├─ renderer.js
│  └─ styles.css
├─ index.html
├─ package.json
└─ pnpm-lock.yaml
```

## Run the baseline

Requirements:

- Node.js compatible with the installed Electron release
- pnpm 11.15.1

```bash
pnpm install
pnpm start
```

## Architecture direction

The default embedded request flow will be:

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

The next increment is the workspace and build foundation: pnpm, strict TypeScript, React/Vite, tsdown, and the initial package boundaries.
