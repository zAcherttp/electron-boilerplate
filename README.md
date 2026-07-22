# Electron Boilerplate

An incremental, opinionated desktop application foundation built around Electron, React, strict TypeScript, and a portable Hono Application API.

The repository is being assembled one verified increment at a time. The current foundation combines an in-memory Hono API, a deny-by-default Electron security shell, and a typed React application layer.

## Current foundation

- Electron 43 with a sandboxed, context-isolated renderer
- production renderer served from the standard, secure `app://bundle` origin
- default-deny navigation, popups, webviews, external URLs, and session permissions
- single-instance lifecycle and package-time Electron security fuses
- React 19 rendered by Vite 8
- Tailwind CSS v4 and shadcn/ui on Base UI with packaged Geist and Geist Mono typography
- main-owned System, Light, and Dark appearance with persisted native/renderer synchronization
- TanStack Router with a code-defined, hash-based desktop route tree
- TanStack Query with feature-owned IPC queries and explicit async states
- top-level React error containment and accessible renderer fallbacks
- Playwright smoke coverage for Electron startup, routing, IPC, and renderer isolation
- Oxfmt formatting and one `pnpm check` quality gate shared by local development and CI
- Windows GitHub Actions validation from a frozen-lockfile checkout
- one-command identity and icon personalization with drift checking
- TypeScript 7 in strict mode
- vite-plugin-doubleshot for Electron main, preload, and application startup
- electron-builder for ASAR packaging and Windows installers
- Hono Application API with Zod request and response contracts
- narrow, sender-validated IPC exposed as `window.app.system.getInfo()`
- Pino structured logging with colored development output and packaged file retention
- Oxlint with TypeScript 7 type-aware, React, accessibility, and Vitest rules
- pnpm 11.15.1 pinned through `packageManager`
- one straightforward Vite command for development and production builds

Vite is the toolchain entrypoint. Doubleshot wires Electron main and preload builds into Vite while keeping their source and runtime boundaries explicit.

```text
.
├─ .github/workflows/
│  ├─ package-windows.yml
│  └─ quality.yml
├─ .gitattributes
├─ .oxfmtrc.json
├─ build/
│  └─ icon.svg
├─ docs/
│  └─ releasing.md
├─ src/
│  ├─ contracts/
│  │  ├─ api-error.ts
│  │  ├─ app-api.ts
│  │  └─ system-info.ts
│  ├─ api/
│  │  ├─ create-api-client.ts
│  │  ├─ create-api.ts
│  │  └─ create-api.test.ts
│  ├─ main/
│  │  ├─ index.ts
│  │  ├─ lifecycle/
│  │  │  └─ register-single-instance.ts
│  │  ├─ logging/
│  │  │  ├─ create-application-logger.test.ts
│  │  │  └─ create-application-logger.ts
│  │  ├─ security/
│  │  │  ├─ assert-trusted-ipc-sender.ts
│  │  │  ├─ configure-session-security.ts
│  │  │  ├─ configure-window-security.ts
│  │  │  ├─ renderer-location.ts
│  │  │  ├─ renderer-protocol.ts
│  │  │  ├─ renderer-url-policy.ts
│  │  │  └─ resolve-renderer-asset-path.ts
│  │  ├─ system/
│  │  │  └─ register-system-info-ipc.ts
│  │  └─ tsconfig.json
│  ├─ preload/
│  │  ├─ index.ts
│  │  └─ tsconfig.json
│  └─ renderer/
│     ├─ app/
│     │  ├─ app-error-boundary.tsx
│     │  ├─ application-query-client.ts
│     │  └─ router.tsx
│     ├─ components/ui/
│     │  ├─ alert.tsx
│     │  ├─ button.tsx
│     │  ├─ empty-state.tsx
│     │  └─ skeleton.tsx
│     ├─ features/system-info/
│     │  ├─ system-info-page.test.tsx
│     │  ├─ system-info-page.tsx
│     │  └─ system-info-query.ts
│     ├─ App.tsx
│     ├─ index.html
│     ├─ main.tsx
│     ├─ styles.css
│     └─ tsconfig.json
├─ tsconfig.json
├─ electron-builder.yml
├─ playwright.config.ts
├─ tests/e2e/application.e2e.ts
└─ vite.config.ts
```

## Requirements

- Node.js 22.18 or newer
- pnpm 11.15.1 (Corepack can select it from `package.json`)

## Personalize the template

Preview the complete identity change, then apply it:

```bash
pnpm setup:dry-run -- --name "Northstar Desktop" --app-id com.example.northstar
pnpm setup:apply -- --name "Northstar Desktop" --app-id com.example.northstar
pnpm setup:check
```

`--name` and `--app-id` are required. The package and executable names default to a lowercase slug of the app name; `--package-name`, `--executable`, `--version`, `--description`, and `--author` override their individual values. The command updates package metadata, MIT copyright holder, electron-builder identity, Windows App User Model ID, renderer title, tests, workflow artifact name, and identity documentation together. It prints the registered app name, application ID, package, executable, version, author, icons, and changed files.

Pass `--icons <file-or-directory>` or place an icon directory at `icons/` or `assets/icons/` for automatic discovery. The application icon may be `icon.svg`, `icon.png`, or `icon.ico`; `app.*` and `application.*` are also recognized. Optional NSIS icons must be named `installer.ico` or `installerIcon.ico` and `uninstaller.ico` or `uninstallerIcon.ico`. The command validates every discovered icon before copying it into `build/` and registering it in `electron-builder.yml`.

`pnpm setup:check` is included in `pnpm check`, so later identity or icon drift fails locally and in CI.

## Development

```bash
pnpm install
pnpm dev
```

`pnpm dev` clears `dist`, starts Vite, builds main and preload, and launches Electron. Use `pnpm debug` for Doubleshot debug output.

## Checks and production run

```bash
pnpm format
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm check
pnpm start
```

Use `pnpm lint:fix` to apply Oxlint's safe automatic fixes.

`pnpm build` creates the production output without launching it. `pnpm start` performs a clean production build and then launches Electron, so it is safe to run after a development session.

`pnpm test:e2e` creates a clean production build and launches it through Playwright's Electron driver. The smoke test verifies the secure `app://` renderer, typed route, live preload → IPC → Hono result, appearance switching and restart persistence, and the absence of raw Node or Electron globals. It uses Electron's bundled Chromium and does not require a separate Playwright browser download.

`pnpm check` is the authoritative quality gate. It checks identity registration and Oxfmt formatting, runs Oxlint and TypeScript, executes Vitest, builds the production application, and finishes with the Electron smoke test. The Windows GitHub Actions workflow installs from the frozen lockfile and runs this same command.

## Packaging

```bash
pnpm package
pnpm test:package
pnpm dist
pnpm dist:signed
```

`pnpm package` creates an unpacked application in `release/win-unpacked` for fast runtime checks. `pnpm dist` creates an unsigned NSIS installer and block map in `release/` without publishing them.

`pnpm test:package` launches the hardened unpacked executable and verifies the same secure renderer and Application API vertical slice as the source-build smoke test. The neutral identity and editable `build/icon.svg` provide explicit replacement points for applications created from this template.

`pnpm dist:signed` requires valid Windows signing credentials and fails rather than creating an unsigned release. See the [Windows packaging and release guide](docs/releasing.md) for the identity checklist, CI secret names, validation steps, and publishing boundary.

Packaged applications also disable Electron's run-as-Node, Node environment option, CLI inspect, and privileged `file://` behaviors. They require the integrity-checked ASAR and enable encrypted cookies.

## Logging

Electron main owns the Pino logger. Development records use `pino-pretty` to render a compact, colored local timestamp, level, PID, `[Electron] [main]` owner, message, and single-line context. Packaged records remain newline-delimited JSON and append synchronously to `main.log` in Electron's operating-system log directory. At launch, a log at or above 5 MiB rotates to `main.1.log`; three numbered archives are retained. Startup, readiness, second-instance activation, renderer termination, load failure, window closure, shutdown, readiness failure, and uncaught main-process exceptions provide the baseline lifecycle trail.

Common password, token, authorization, and cookie fields are redacted at the logger boundary. Do not log raw IPC payloads, request bodies, credentials, or user documents. The renderer receives no generic logging IPC method; add feature-specific diagnostics only when a product requirement defines their data policy.

The startup record includes the absolute log path, storage mode, rotation threshold, archive count, and whether rotation occurred. If the packaged log directory cannot be prepared, logging falls back to stderr and emits an explicit failure record. The packaged-runtime smoke test verifies this storage contract and the readiness record.

Synchronous file output is deliberate for this low-volume lifecycle baseline so early-exit and crash records can be flushed deterministically. A product that introduces sustained or high-volume logging should replace it with a separately tested worker transport rather than sending payload-heavy records through Electron main.

## Electron security policy

The renderer may navigate only within its exact development or production authority. New windows are always denied. An HTTPS URL is handed to the operating system only when its exact origin appears in `trustedExternalOrigins` in `src/main/index.ts`; the scaffold intentionally starts with an empty list and includes no consent or remembered-domain system.

Browser permission checks and requests are denied until a product feature introduces a narrowly owned policy. Deep-link registration is likewise optional; the single-instance lifecycle needed by a future deep-link module is already present.

## Application chrome

The renderer owns a compact Quiet Precision title bar while Electron main remains the authority for window state and commands. Its title comes from the application name registered by `pnpm setup:apply`; it is not duplicated in renderer source. Windows and Linux use accessible HTML minimize, maximize/restore, and close controls. macOS keeps its native traffic lights.

The complete title bar is draggable except for its controls. Focus and maximize changes return through a validated state contract, and raw Electron objects never cross preload. The native menu is auto-hidden on Windows and Linux but remains available through the standard Alt-key behavior.

The application root is a fixed two-row frame: the title bar occupies the first row and a shadcn Base UI Scroll Area owns the remaining viewport. This keeps the custom scrollbar below the title bar, prevents document-level scrolling, and gives every route the same token-driven scrollbar without page-specific setup.

The appearance control offers System, Light, and Dark modes. Electron main owns the selected source through `nativeTheme`, persists it in the application's `userData` directory, and broadcasts the resolved palette through a narrow typed bridge. The renderer applies the matching shadcn `.dark` selector before React mounts and keeps it synchronized with native menus, dialogs, and operating-system changes. The BrowserWindow background follows the resolved palette to avoid a contrasting startup flash.

## Renderer conventions

Routes are code-defined to keep this initial tree explicit and avoid generated TypeScript. Hash history keeps desktop routes behind the contained `app://bundle/index.html` entry point. TanStack Query uses `networkMode: 'always'` because its current transport is IPC rather than browser networking.

Renderer primitives use shadcn/ui on Base UI with the Nova, Stone, and Emerald preset `b2BVUGjbM`. Geist and Geist Mono are bundled through Fontsource; packaged applications do not download fonts at runtime. `components.json` scopes generated components and utilities to `src/renderer`. Preview new components with `pnpm exec shadcn add <name> --dry-run` before writing them. The [project manual](docs/project-manual.md#renderer-design-system) records the preset and update workflow.

## TypeScript 7 support

This foundation uses TypeScript 7.0.2 directly for project type-checking. Vite and Doubleshot handle transpilation, while Oxlint provides type-aware linting without introducing a second TypeScript compiler.

## Architecture direction

The future embedded request flow is:

```text
React renderer
  → typed preload API
  → validated Electron IPC
  → Electron main
  → typed Hono client over app.fetch()
  → local data, filesystem, or remote APIs
```

Hono runs in memory without opening a localhost port. A future Node adapter can run the same Application API as a standalone HTTP service when a web client becomes a real second consumer.

## Plans

- [Project manual: setup, perks, quirks, and utilities](docs/project-manual.md)
- [Full visual implementation plan](docs/plan.html)
- [Brief session-reload plan](docs/plan.md)
- [Interactive title-bar design playground](docs/titlebar-playground.html)

The core scaffold is verified through packaging: Vite, TypeScript, the secure Electron shell, Application API slice, renderer foundation, formatting, source and packaged-runtime smoke tests, editable identity, Pino logging, and unsigned NSIS generation. The Windows quality and manual packaging workflows both pass from clean checkouts.

## License

[MIT](LICENSE)
