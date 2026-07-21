# Electron Boilerplate — Quick Plan

Updated: 2026-07-21
Status: Core scaffold complete through Phase 06; local package accepted and remote workflow runs pending

The detailed plan is in [`plan.html`](./plan.html).

## Goal

Build an opinionated but small Electron boilerplate using:

- pnpm workspace
- strict TypeScript
- Electron
- Vite + React for the renderer
- vite-plugin-doubleshot for Electron main/preload builds and startup
- Hono as a portable Application API
- Zod contracts
- TanStack Router and TanStack Query
- electron-builder
- Vitest and Playwright
- Oxlint, formatting, Pino, and GitHub Actions

Do not use `electron-vite`. Vite remains the single command entrypoint, with Doubleshot wiring in Electron main and preload builds.

## Runtime architecture

Default embedded flow:

```text
React renderer
  → narrow typed preload API
  → validated Electron IPC
  → Electron main
  → typed Hono client over app.fetch()
  → database / filesystem / remote APIs
```

Hono runs in memory by default, without a localhost port. A future standalone Node adapter can expose the same Hono app through `@hono/node-server` when a web client needs it.

CPU-heavy, crash-prone, or long-running work belongs in an Electron utility process or worker—not Electron main or the thin Application API.

## Current repository structure

```text
src/
  api/
    create-api.ts
  contracts/
  main/
  preload/
  renderer/
    app/
    components/ui/
    features/system-info/
```

Keep the API app-local until a standalone web runtime becomes a real second consumer. At that point, extract `src/api` to `packages/api` and add a thin `apps/api-server` Node adapter.

## Boundary rules

- Packages never import from apps.
- Renderer never imports Electron or Application API implementations.
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
- Add the React renderer and Electron builds to one Vite configuration.
- Let Doubleshot own development startup and Electron restarts.

Acceptance: clean install, development startup, typecheck, and production build pass.

### Phase 02 — Secure Electron shell

- Add lifecycle, window ownership, and single-instance behavior. **Done**
- Enable sandbox and context isolation; keep Node integration disabled. **Done**
- Serve packaged renderer assets from a contained `app://bundle` protocol. **Done**
- Restrict navigation, new windows, webviews, external URLs, permissions, and CSP. **Done**
- Apply package-time Electron security fuses. **Done**

Acceptance: React launches in development and packaged modes without direct Node access. Packaged `app://` rendering and the live preload → IPC → Hono slice are verified.

### Phase 03 — Contracts, IPC, and Hono Application API

- Add Zod success/error contracts. **Done**
- Add narrow preload methods and IPC sender/payload validation. **Done**
- Add the portable in-memory Hono app. **Done**
- Implement the first vertical slice: `system.getInfo`. **Done**
- Add a standalone Node adapter only when a web client becomes a real second consumer.

Acceptance: React renders validated system information through preload → IPC → Hono, and the same Hono route passes a direct in-memory request test.

### Phase 04 — Renderer foundation

- Add typed routing, query ownership, error boundary, and app shell. **Done**
- Add accessible loading, empty, and failure states. **Done**
- Keep UI and workflows organized by feature. **Done**
- Tag replaceable custom primitives with `@shadcn-replaceable`. **Done**

Acceptance: the packaged vertical slice renders through the typed route, remains keyboard-accessible, and has tested success, failure, and retry behavior. **Verified**

### Phase 05 — Quality and CI

- Add contract, Hono integration, renderer, and Electron smoke tests. **Done**
- Add formatting, linting, typechecking, test, and build gates. **Done**
- Run all gates in GitHub Actions. **Workflow configured**

Acceptance: `pnpm check` passes locally. The Windows workflow installs with `--frozen-lockfile` and runs the same gate; its first GitHub run supplies the final remote clean-checkout evidence.

### Phase 06 — Packaging

- Packaging foundation: electron-builder, ASAR, isolated `release/` output, artifact naming, unpacked launch, and unsigned NSIS generation. **Done**
- Add an editable product icon and explicit application identity. **Done**
- Add signing-ready configuration without secrets. **Done**
- Add a hardened package smoke test and Windows release documentation. **Done**
- Add manual signed/unsigned package automation without publishing. **Configured**

Acceptance: `pnpm test:package` launches the unpacked Windows artifact and completes the system-info vertical slice; `pnpm dist` produces the branded unsigned NSIS installer and block map. **Accepted locally**

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
- deny browser permissions until a feature owns a narrow policy
- serve production assets from `app://`, not privileged `file://`
- disable unneeded Electron capabilities with package-time fuses

## Standard quality gate

```bash
pnpm check
```

## Next action

The essential scaffold is complete. Start an optional module only when a real application requirement defines its owner and acceptance test. Consent, remembered external origins, permission grants, deep-link routing, and the Node HTTP adapter remain deliberately absent.
