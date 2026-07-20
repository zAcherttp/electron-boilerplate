# Electron Boilerplate — Quick Plan

Updated: 2026-07-20
Status: initial cleanup and baseline verification complete; Phase 01 is next

The detailed plan is in [`plan.html`](./plan.html).

## Goal

Build an opinionated but small Electron boilerplate using:

- pnpm workspace
- strict TypeScript
- Electron
- Vite + React for the renderer
- tsdown for main, preload, BFF, and server builds
- Hono as a desktop Backend for Frontend (BFF)
- Zod contracts
- TanStack Router and TanStack Query
- electron-builder
- Vitest and Playwright
- ESLint, Prettier, Pino, and GitHub Actions

Do not use `electron-vite`. Vite owns only the renderer build; the remaining build and packaging steps stay explicit.

## Runtime architecture

Default embedded flow:

```text
React renderer
  → narrow typed preload API
  → validated Electron IPC
  → Electron main
  → Hono app.request()
  → database / filesystem / remote APIs
```

Hono runs in memory by default, without a localhost port. A thin standalone Node adapter exposes the same Hono app through `@hono/node-server` when needed.

CPU-heavy, crash-prone, or long-running work belongs in an Electron utility process or worker—not Electron main or the thin BFF.

## Intended repository structure

```text
apps/
  desktop/
    src/
      main/
      preload/
      renderer/
  bff-server/
    src/index.ts

packages/
  bff/
    src/app.ts
    src/features/
    src/middleware/
  contracts/
    src/ipc/
    src/http/

tests/e2e/
scripts/dev.mjs
```

`packages/bff` has two real consumers: embedded Electron mode and `apps/bff-server`. The server app is only a runtime adapter.

## Boundary rules

- Packages never import from apps.
- Renderer never imports Electron or BFF implementations.
- Preload never exposes raw `ipcRenderer`.
- Validate IPC, HTTP, environment variables, user input, and external responses at their boundaries.
- Contracts contain schemas and data shapes, not workflows.
- Product behavior stays with feature owners.
- Avoid generic `utils`, `services`, `helpers`, `common`, and root barrel exports.
- Do not add a shared package until there is a stable contract or more than one real consumer.

## Incremental phases

### Phase 00 — Baseline

- Confirm the existing minimal Electron clone starts.
- Record the clean baseline and preserve git history.

Acceptance: baseline behavior is known and reproducible.

### Phase 01 — Workspace and builds

- Convert npm/plain JavaScript to pnpm and strict TypeScript.
- Create workspace boundaries.
- Add React/Vite renderer and tsdown builds.
- Add a development supervisor.

Acceptance: clean install, development startup, typecheck, and production build pass.

### Phase 02 — Secure Electron shell

- Add lifecycle, window ownership, and single-instance behavior.
- Enable sandbox and context isolation; keep Node integration disabled.
- Restrict navigation, new windows, external URLs, and CSP.

Acceptance: React launches in development and packaged modes without direct Node access.

### Phase 03 — Contracts, IPC, and Hono

- Add Zod success/error contracts.
- Add narrow preload methods and IPC sender/payload validation.
- Add the shared Hono app and standalone Node adapter.
- Implement the first vertical slice: `system.getInfo`.

Acceptance: React renders validated system information through preload → IPC → Hono, and the same Hono route passes a standalone request test.

### Phase 04 — Renderer foundation

- Add typed routing, query ownership, error boundary, and app shell.
- Add accessible loading, empty, and failure states.
- Keep UI and workflows organized by feature.

Acceptance: the vertical slice is navigable, keyboard-accessible, and visibly handles success and failure.

### Phase 05 — Quality and CI

- Add contract, Hono integration, renderer, and Electron smoke tests.
- Add formatting, linting, typechecking, test, and build gates.
- Run all gates in GitHub Actions.

Acceptance: CI validates a clean checkout end to end.

### Phase 06 — Packaging

- Configure electron-builder, ASAR, icons, and artifact naming.
- Add signing-ready configuration without secrets.
- Add package smoke tests and release documentation.

Acceptance: a local packaged artifact launches and completes the system-info vertical slice.

## Optional modules

Add only when activated by a real requirement:

- SQLite + Drizzle and generated migrations
- secure credential storage
- auto-updater
- deep links and custom protocols
- native menus, tray, and shortcuts
- narrow filesystem workflows
- authentication with browser login and PKCE
- SSE or WebSocket events
- utility-process background jobs
- telemetry and error reporting
- internationalization
- Tailwind and a reusable design system
- offline synchronization

Before adding an optional module, define its owner, threat model, persistence and packaging impact, and acceptance test.

## Security invariants

- `contextIsolation: true`
- renderer sandbox enabled
- `nodeIntegration: false`
- no raw Electron API exposed through preload
- validate IPC senders and untrusted payloads
- never place backend secrets in renderer bundles
- allowlist navigation and external URLs

## Standard quality gate

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

## Next action

Implement Phase 01 only: the workspace and build foundation. Do not install optional modules or begin later phases until the current phase acceptance criteria pass.
