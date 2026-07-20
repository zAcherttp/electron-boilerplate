# Electron Boilerplate

An incremental, opinionated desktop application foundation built around Electron, React, strict TypeScript, and a portable Hono Application API.

The repository is being assembled one verified increment at a time. The current increment adds an in-memory Hono API reached through validated Electron IPC.

## Current foundation

- Electron 43 with a sandboxed, context-isolated renderer
- React 19 rendered by Vite 8
- TypeScript 7 in strict mode
- vite-plugin-doubleshot for Electron main, preload, and application startup
- electron-builder for ASAR packaging and Windows installers
- Hono Application API with Zod request and response contracts
- narrow, sender-validated IPC exposed as `window.app.system.getInfo()`
- Oxlint with TypeScript 7 type-aware, React, accessibility, and Vitest rules
- pnpm 11.15.1 pinned through `packageManager`
- one straightforward Vite command for development and production builds

Vite is the toolchain entrypoint. Doubleshot wires Electron main and preload builds into Vite while keeping their source and runtime boundaries explicit.

```text
.
├─ src/
│  ├─ contracts/
│  │  ├─ api-error.ts
│  │  ├─ app-api.ts
│  │  └─ system-info.ts
│  ├─ api/
│  │  ├─ create-api.ts
│  │  └─ create-api.test.ts
│  ├─ main/
│  │  ├─ index.ts
│  │  ├─ system/
│  │  │  └─ register-system-info-ipc.ts
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
pnpm lint
pnpm typecheck
pnpm build
pnpm start
```

Use `pnpm lint:fix` to apply Oxlint's safe automatic fixes.

`pnpm build` creates the production output without launching it. `pnpm start` performs a clean production build and then launches Electron, so it is safe to run after a development session.

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

Hono runs in memory without opening a localhost port. A future Node adapter can run the same Application API as a standalone HTTP service when a web client becomes a real second consumer.

## Plans

- [Full visual implementation plan](docs/plan.html)
- [Brief session-reload plan](docs/plan.md)

The Vite, TypeScript, electron-builder, and first Application API vertical slice are verified. The next increment can harden the Electron shell or extend the API with the first product-owned feature.
