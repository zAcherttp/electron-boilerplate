# Electron Boilerplate — Quick Plan

Updated: 2026-07-22
Status: v0.1.0 checkpoint verified locally and on Windows, macOS, and Linux CI

This file is the concise architecture and status record. New users should begin with the [README](../README.md) and [project manual](./project-manual.md); the complete incremental history remains in [`plan.html`](./plan.html).

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
- Tailwind CSS and shadcn/ui on Base UI
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
- Add main-owned structured logging with packaged file output and credential redaction. **Done**

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

Acceptance: `pnpm check` passes locally and in the Windows workflow after a clean `--frozen-lockfile` install. **Verified**

### Phase 06 — Packaging

- Packaging foundation: electron-builder, ASAR, isolated `release/` output, artifact naming, unpacked launch, and unsigned NSIS generation. **Done**
- Add an editable product icon and explicit application identity. **Done**
- Add signing-ready configuration without secrets. **Done**
- Add a hardened package smoke test and Windows release documentation. **Done**
- Add manual signed/unsigned package automation without publishing. **Configured**

Acceptance: `pnpm test:package` launches the unpacked Windows artifact and completes the system-info vertical slice; the manual Windows workflow produces and uploads the unsigned NSIS installer and block map. **Verified**

### Phase 07 — Template experience

- Add one non-interactive setup command for app identity and metadata. **Done**
- Auto-detect, validate, copy, register, and report application and optional NSIS icons. **Done**
- Provide dry-run and drift-check commands. **Done**
- Include identity registration in the unified quality gate. **Done**
- Cover the owned setup workflow with an isolated repository-level integration test. **Done**

Acceptance: a temporary clone can be fully personalized with one command, the preview writes nothing, and the resulting identity and icon registration pass the same check used by CI. **Verified**

### Phase 08 — Operational maturity

Execute these items in order:

1. Finish logging operations: add readable colored development output, define bounded retention and rotation, make the packaged log location observable, and cover operational failure behavior. **Done**
2. Add dependency maintenance automation. **Done**
3. Declare the platform contract and add macOS and Linux smoke lanes. **Done**

The macOS and Linux lanes must distinguish source-runtime smoke support from distributable package support. Do not claim packaging support until each platform has its own metadata, icons, signing boundary, and packaged-runtime acceptance evidence.

Acceptance: logging has an explicit operating policy, dependency updates arrive through a controlled automated workflow, and all declared platforms have clean-checkout smoke evidence at the support level documented by the repository. **Verified.**

### Phase 09 — Renderer design system

- Lock and record shadcn preset `b2BVUGjbM`: Nova, Stone, Emerald, Lucide, Geist, default radius, and subtle menu accents. **Done**
- Use shadcn/ui with Base UI explicitly selected, even while Base UI is the upstream default. **Done**
- Add Tailwind CSS v4 through `@tailwindcss/vite` without changing Vite as the single command entrypoint. **Done**
- Scope `@/*` to `src/renderer/*`; generated UI belongs in `src/renderer/components/ui` and renderer utilities in `src/renderer/lib`. **Done**
- Commit `components.json` as the design-system source of truth and document `shadcn add --dry-run` and `--diff`. **Done**
- Replace the tagged custom Button, Alert, Skeleton, and Empty primitives while preserving feature ownership and the current application character. **Done**
- Merge theme tokens into `src/renderer/styles.css` and remove the superseded primitive CSS. **Done**
- Package Geist locally and keep the complete UI toolchain out of production dependencies. **Done**

Acceptance: the selected Base UI preset is reproducible, all `@shadcn-replaceable` primitives are migrated without duplicate styling, success/loading/error/empty renderer states remain accessible, and `pnpm check` plus `pnpm test:package` pass. **Verified**

### Phase 10 — Custom application chrome

- Compare three directions in the archived [`titlebar-playground.html`](design/titlebar-playground.html) and select Quiet Precision as the scaffold default. **Done**
- Keep one renderer-owned `ApplicationTitleBar` in the app shell; source the visible title from Electron's registered application identity rather than a duplicate string. **Done**
- Use an HTML drag region with explicit non-draggable controls. Keep native macOS traffic lights and use HTML minimize, maximize/restore, and close controls on Windows/Linux. **Done**
- Add a narrow, validated preload/IPC contract for window commands and observable focus/maximize state. Never expose `BrowserWindow`, `ipcRenderer`, or generic channel access. **Done**
- Preserve resize behavior, system window shortcuts, inactive-window treatment, keyboard focus, accessible labels, and reduced-motion behavior. **Done**
- Auto-hide rather than remove the default application menu so Windows/Linux users retain standard Alt-key access; do not imitate the menu in HTML. **Done**
- Cover the schema and component states in Vitest, exercise maximize/restore in source and packaged Electron smoke tests, and close the source application through the rendered control. **Done**

Acceptance: the chosen title bar is draggable outside interactive controls, uses the personalized app name, remains operable by mouse and keyboard, reflects focus and maximize state, preserves native macOS controls, and passes `pnpm check` plus `pnpm test:package` on the currently declared platform contract. **Verified**

### Phase 11 — Native appearance

- Add typed System, Light, and Dark appearance contracts and a narrow sender-validated preload/IPC API. **Done**
- Keep `nativeTheme.themeSource` in Electron main as the single source of truth for native and renderer surfaces. **Done**
- Persist the source in a versioned, schema-validated user-data preference and recover invalid files to System. **Done**
- Apply the resolved palette before React mounts, keep the shadcn `.dark` selector synchronized, and update the BrowserWindow background to prevent a contrasting startup flash. **Done**
- Add an accessible Base UI radio menu to the title bar without changing the custom controls' geometry-on-press policy. **Done**
- Cover contracts, persistence, renderer selection, palette application, native Electron switching, and restart persistence. **Done**

Acceptance: System remains the default, explicit Light/Dark choices synchronize native and renderer surfaces, the preference survives a clean application restart, invalid storage fails safely, and the full local quality and package gates pass. **Verified**

### Phase 12 — Pre-release consolidation

- Keep `src/main/index.ts` identity-only and move application composition and window creation to named owners. **Done**
- Split renderer feature CSS from global tokens and application-wide defaults. **Done**
- Split the personalization CLI from identity, icon, and repository mutation owners. **Done**
- Keep identity-independent test fixtures independent from personalization. **Done**
- Reduce the README to onboarding and route operational detail into the manual. **Done**
- Archive the title-bar studies under `docs/design`. **Done**
- Normalize direct dependency ranges, repository ignores, and release notes. **Done**

Acceptance: the full local gate, Windows packaged-runtime test, and a freshly installed personalized checkout pass without identity drift. **Verified.**

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

Next: publish the v0.1.0 tag, then add product capabilities only when their optional-module activation rules are met. Consent, remembered external origins, permission grants, deep-link routing, and the Node HTTP adapter remain deliberately absent.
