# Using the Electron Boilerplate

This is the operational reference for applications created from the template. The README gets a new repository running; this manual explains the conventions that keep it secure, portable, and easy to extend.

## Find what you need

| Task                            | Section                                             |
| ------------------------------- | --------------------------------------------------- |
| Rename the template             | [Personalization utility](#personalization-utility) |
| Learn the commands              | [Command map](#command-map)                         |
| Change the title bar            | [Application title bar](#application-title-bar)     |
| Extend light and dark modes     | [Appearance and theme](#appearance-and-theme)       |
| Add shadcn components           | [Renderer design system](#renderer-design-system)   |
| Understand unusual choices      | [Project quirks](#project-quirks)                   |
| Find an owner in the repository | [Repository landmarks](#repository-landmarks)       |
| Diagnose a failure              | [Troubleshooting](#troubleshooting)                 |

## What this template gives you

The repository is deliberately a foundation rather than a sample application:

- one Vite entrypoint for the React renderer, Electron main process, and preload script
- a sandboxed renderer with a narrow typed preload API
- an in-memory Hono Application API that does not open a localhost port
- Zod validation at IPC and API boundaries
- TanStack Router and feature-owned TanStack Query queries
- Tailwind CSS v4 and shadcn/ui on Base UI with packaged Geist and Geist Mono fonts
- deny-by-default navigation, popup, permission, and external-link policies
- Pino logging owned by Electron main
- electron-builder packaging, hardened Electron fuses, and NSIS installer generation
- Oxfmt, Oxlint, TypeScript, Vitest, Playwright, and cross-platform source CI behind one quality command
- repository-owned identity and icon personalization

Development, production, and packaged applications exercise the same vertical slice. The renderer calls the preload bridge, Electron main validates the IPC sender, and main calls the Hono app through `app.fetch()`. There is no alternate mock architecture to replace when product work begins.

## First-time setup

After creating a repository from the GitHub template, enable Corepack if pnpm is not already available and install the pinned package-manager version:

```bash
corepack enable
pnpm install
```

Preview the application identity before changing files:

```bash
pnpm setup:dry-run -- --name "Northstar Desktop" --app-id com.example.northstar
```

Apply it after reviewing the reported files:

```bash
pnpm setup:apply -- --name "Northstar Desktop" --app-id com.example.northstar
pnpm setup:check
pnpm check
pnpm dev
```

The bare `pnpm setup` command belongs to pnpm itself. This repository therefore calls its application setup command `pnpm setup:apply`.

## Personalization utility

The setup utility treats identity as one repository-wide contract instead of a collection of unrelated strings. It updates:

- package name, version, description, and author
- MIT license copyright holder
- electron-builder application ID, product name, and executable name
- Windows App User Model ID
- renderer document title and Electron application title
- source and packaged Electron smoke-test expectations
- Windows workflow artifact name
- release guide and plan identity references
- application, installer, and uninstaller icon registrations

Required options:

| Option     | Meaning                                         |
| ---------- | ----------------------------------------------- |
| `--name`   | User-facing product name                        |
| `--app-id` | Reverse-DNS ID, such as `com.example.northstar` |

Optional options:

| Option           | Default                                      |
| ---------------- | -------------------------------------------- |
| `--package-name` | Lowercase slug generated from the app name   |
| `--executable`   | Package name                                 |
| `--version`      | Current package version                      |
| `--description`  | Current package description                  |
| `--author`       | Current package author                       |
| `--icons`        | Automatically discover `icons/` when omitted |

Use the three setup modes deliberately:

```bash
# Validate and show the complete change without writing files
pnpm setup:dry-run -- --name "Northstar Desktop" --app-id com.example.northstar

# Apply the validated change
pnpm setup:apply -- --name "Northstar Desktop" --app-id com.example.northstar

# Verify that identity and registered icon files have not drifted
pnpm setup:check
```

`pnpm setup:check` is the first gate inside `pnpm check`, so identity drift is also detected in CI.

### Icon discovery

Pass a file or directory explicitly:

```bash
pnpm setup:apply -- --name "Northstar Desktop" --app-id com.example.northstar --icons ./brand/icons
```

When `--icons` is omitted, setup checks these directories in order:

1. `icons/`
2. `assets/icons/`

Recognized names are case-insensitive:

| Purpose          | Preferred name        | Also accepted                                    |
| ---------------- | --------------------- | ------------------------------------------------ |
| Application      | `icon.svg`            | `icon.png`, `icon.ico`, `app.*`, `application.*` |
| NSIS installer   | `installerIcon.ico`   | `installer.ico`                                  |
| NSIS uninstaller | `uninstallerIcon.ico` | `uninstaller.ico`                                |

An explicit application icon may also be passed as a single file. Setup validates SVG, PNG, and ICO signatures before copying anything. If a directory contains several otherwise unnamed application icons, setup stops and asks for an unambiguous conventional filename.

Discovered files are copied into `build/` and registered in `electron-builder.yml`. The summary prints both the source and registered destination.

## Command map

### Application lifecycle

| Command      | Purpose                                                                   |
| ------------ | ------------------------------------------------------------------------- |
| `pnpm dev`   | Clear `dist`, start Vite and Doubleshot, then launch development Electron |
| `pnpm debug` | Run development mode with Doubleshot debug output                         |
| `pnpm build` | Produce renderer, main, and preload production output                     |
| `pnpm start` | Build clean production output and launch it with Electron                 |

### Code quality

| Command             | Purpose                                                      |
| ------------------- | ------------------------------------------------------------ |
| `pnpm format`       | Apply Oxfmt                                                  |
| `pnpm format:check` | Check formatting without writing                             |
| `pnpm lint`         | Run Oxlint, including TypeScript-aware rules                 |
| `pnpm lint:fix`     | Apply supported Oxlint fixes                                 |
| `pnpm typecheck`    | Type-check every TypeScript project reference                |
| `pnpm test`         | Run Vitest tests                                             |
| `pnpm test:e2e`     | Build and smoke-test the source production application       |
| `pnpm check`        | Run registration, formatting, lint, types, tests, build, E2E |

### Windows packaging

| Command             | Purpose                                                              |
| ------------------- | -------------------------------------------------------------------- |
| `pnpm package`      | Create the unpacked app in `release/win-unpacked`                    |
| `pnpm test:package` | Package and smoke-test the real unpacked executable                  |
| `pnpm dist`         | Create an unsigned NSIS installer and block map                      |
| `pnpm dist:signed`  | Require signing credentials and create a signed Windows distribution |

Packaging never publishes an artifact. GitHub Actions uploads build results only to the workflow run; adding a public release or update feed is a product decision.

## Application title bar

Quiet Precision is the scaffold's default application chrome. The 44px renderer surface uses the existing Stone and Emerald tokens, keeps a broad drag region, and places Windows/Linux controls at the familiar right edge. The title comes from `app.getName()`, whose value is registered and updated by the setup utility.

Electron main owns minimize, maximize/restore, close, focus, and maximize state. The sandboxed preload exposes only those named operations and a state subscription. Each command validates its sender against the active window, and each state object passes the shared Zod contract before crossing IPC. Do not add a generic window method or channel escape hatch.

On macOS, `hiddenInset` preserves native traffic lights and the renderer reserves their space. Windows and Linux use the HTML controls with `titleBarStyle: 'hidden'`. Interactive controls are `app-region: no-drag`; the rest of the title bar is draggable. The default application menu is auto-hidden rather than removed, retaining standard Alt-key access where supported.

When changing the title bar:

- keep the application name owned by setup and Electron main;
- preserve keyboard labels and visible focus treatment;
- test both native-control and custom-control renderer states;
- run both `pnpm check` and `pnpm test:package` because frame behavior differs between source and packaged windows.

The three original design studies remain in the [`design/titlebar-playground.html`](design/titlebar-playground.html) archive.

The root application frame has two rows. `ApplicationTitleBar` owns the fixed 44px chrome row, and the application-wide shadcn Base UI `ScrollArea` owns the remaining row. `html`, `body`, and `#root` never scroll. Add route content normally inside the root outlet; do not create another page-level vertical scroller unless a feature explicitly needs nested scrolling.

## Appearance and theme

The title-bar appearance menu exposes three explicit sources: System, Light, and Dark. Electron main is the sole owner of that choice through `nativeTheme.themeSource`; do not introduce a renderer-only theme context or `localStorage` preference. The selected source is stored as a versioned, Zod-validated `appearance.json` file under Electron's `userData` directory. Invalid files recover to System, and writes replace the complete small preference document.

The renderer synchronously mirrors `prefers-color-scheme` onto the shadcn `.dark` class before React mounts, then reconciles against the validated main-owned state. This gives system mode a pre-paint palette while keeping explicit overrides and later operating-system changes authoritative. All application styling should use the semantic color tokens in `styles.css`; feature code must not branch on a theme or duplicate light/dark colors.

The BrowserWindow background follows the resolved palette both at construction and after theme updates. This matters because it is visible before the renderer's first complete paint. Native menus, dialogs, DevTools, and macOS window surfaces follow the same Electron theme source.

When extending appearance:

- add new persisted fields through a versioned schema change rather than accepting unvalidated JSON;
- keep IPC operations named and sender-validated;
- preserve System as the default and as an explicit reset option;
- test light/dark selector changes and restart persistence with an isolated user-data directory;
- use semantic tokens so title-bar controls, scrollbars, overlays, and route content change together.

## Renderer design system

The renderer uses shadcn/ui on Base UI with the reproducible preset [`b2BVUGjbM`](https://ui.shadcn.com/create?preset=b2BVUGjbM):

| Setting      | Value   |
| ------------ | ------- |
| Style        | Nova    |
| Base color   | Stone   |
| Theme        | Emerald |
| Chart color  | Emerald |
| Icon library | Lucide  |
| Font         | Geist   |
| Heading font | Inherit |
| Radius       | Default |
| Menu accent  | Subtle  |
| Menu color   | Default |

`@fontsource-variable/geist` and `@fontsource-variable/geist-mono` package both variable families into the Vite build. Geist is the interface family; Geist Mono is the `font-mono` token used for runtime and machine-readable values. Production output contains local `.woff2` assets, so development, source production, and packaged applications never fetch a runtime web font.

The shadcn, Tailwind, Base UI, font, icon, and class-composition packages stay in `devDependencies` because Vite bundles their used code and assets into `dist/renderer`. Moving shadcn's generated dependency list into production dependencies makes electron-builder copy the CLI and Tailwind toolchain into `app.asar`; in the baseline measurement that grew the archive from about 22 MB to 106 MB without adding runtime behavior.

`components.json` is the CLI source of truth. Its aliases deliberately resolve into `src/renderer`; generated components must not land in repository-level `src/components`. TypeScript 7 resolves `@/*` through `paths` without the removed `baseUrl` option, while Vite maps `@` to the same renderer root.

Inspect the resolved configuration:

```bash
pnpm exec shadcn info
pnpm exec shadcn preset resolve
```

Preview registry changes before adding a component:

```bash
pnpm exec shadcn add dialog --dry-run
pnpm exec shadcn add dialog --diff
pnpm exec shadcn add dialog
```

Keep downloaded shadcn components in `src/renderer/components/ui` and edit them as application-owned source. Product-specific composition remains with its feature; do not move workflows into generic UI primitives. Preserve semantic loading, empty, and failure states and run `pnpm check` after component changes.

`src/renderer/styles.css` owns Tailwind imports, semantic theme tokens, document defaults, and small application-wide fallbacks. The root frame is owned by `src/renderer/app/application-frame.css`; title-bar, appearance, and system-info styling stays beside those features. Add a global rule only when every route truly shares it.

## Project quirks

### Doubleshot owns Electron startup

Vite is the command entrypoint, while `vite-plugin-doubleshot` builds main and preload and launches Electron in development. Do not add a second Electron-specific Vite configuration unless the existing plugin can no longer represent a real requirement.

`pnpm dev` serves the renderer from `http://127.0.0.1:5173`. `pnpm start` and packaged builds use the contained `app://bundle` protocol. A production window trying to load `dist/renderer/index.html` directly is a regression.

### Hono is embedded, not an HTTP server

The Application API runs in Electron main and is called in memory with standard Request/Response objects. No port is opened by default. This keeps the desktop boundary small while allowing the Hono app to move behind a Node adapter later if a genuine web client appears.

Do not put Electron APIs inside the Hono app. Electron-specific adapters belong in main; portable application behavior belongs in `src/api`.

### The renderer is intentionally untrusted

The renderer has no Node integration and does not receive raw `ipcRenderer`, filesystem, shell, or logging access. Add narrow preload methods for named product capabilities, validate the sender in main, and validate data at the boundary.

External HTTPS links are denied unless their exact origin is listed in `trustedExternalOrigins`. Browser permissions are denied until a feature introduces an explicit policy. The scaffold does not include consent history or remembered origins.

### TypeScript 7 is checked, not used as the bundler

Vite and Doubleshot transpile application source. TypeScript 7 performs strict project-reference checking through `pnpm typecheck`. Keep new source inside the appropriate referenced `tsconfig`; otherwise a test may run successfully while its file is absent from the typecheck graph.

The project deliberately avoids authored `any`, `unknown`, and workaround type assertions. Validate untrusted inputs with schemas and let types follow the validated contract.

TypeScript 7 removed `baseUrl`. Import aliases use `paths` directly; do not reintroduce `baseUrl` from older Vite or shadcn setup guides.

### The package manager is pinned

`packageManager` in `package.json` pins pnpm so local development and clean CI installs resolve through the same package-manager generation. Prefer Corepack over globally installing an unrelated pnpm version.

### Packaging is Windows-first

The checked-in builder configuration produces an unpacked Windows application and NSIS installer. NSIS is a classic Windows installer format; it is not MSIX.

The quality workflow runs the source application and the complete `pnpm check` gate on Windows, macOS, and Linux; Linux uses a virtual X display. This establishes source-runtime compatibility only. macOS and Linux distributions still require their own builder targets, icons, metadata, signing boundaries, artifact workflows, and packaged-runtime acceptance evidence before they are advertised as distributable platforms.

### Dependencies are intentionally maintained

Direct dependencies use exact versions so a clean checkout resolves from the reviewed lockfile and manifest together. Dependabot checks pnpm/npm and GitHub Actions weekly. Minor and patch updates are grouped to keep routine maintenance reviewable; major upgrades remain separate because they can change the template's platform or architecture contract.

### Logging changes between development and packaging

Electron main renders development records through `pino-pretty`: local date/time, colored level, PID, `[Electron] [main]`, message, and compact single-line context. This is presentation only—the underlying events and redaction contract are shared with production. A packaged application keeps newline-delimited JSON and writes synchronously to `main.log` in Electron's operating-system log directory. On the next launch, a file at or above 5 MiB rotates through `main.1.log`, `main.2.log`, and `main.3.log`; older archives are removed. One unusually large final session can exceed the threshold until the next launch, because rotation intentionally occurs before Pino opens the active file.

The application-starting record contains the absolute log path, selected storage mode, rotation threshold, retained archive count, and whether launch-time rotation occurred. If the directory cannot be created or opened, the application remains runnable, falls back to stderr, and records the reason. Readiness failures and uncaught main-process exceptions are written as fatal records before termination.

Common credential fields are redacted, but feature code must still avoid logging request bodies, documents, tokens, or raw IPC payloads. Synchronous file output is appropriate for this small lifecycle trail; sustained or high-volume logging requires a separately tested worker transport.

## Repository landmarks

| Path                            | Owner                                                        |
| ------------------------------- | ------------------------------------------------------------ |
| `src/renderer`                  | React routes, queries, features, UI, and global tokens       |
| `components.json`               | shadcn Base UI style, registry, and renderer path contract   |
| `src/preload`                   | Narrow renderer-to-main API                                  |
| `src/main/index.ts`             | Stable application identity entrypoint                       |
| `src/main/start-application.ts` | Main-process composition and lifecycle                       |
| `src/main/application-window`   | Main-owned title-bar state and window commands               |
| `src/api`                       | Portable in-memory Hono Application API                      |
| `src/contracts`                 | Zod boundary schemas and data shapes                         |
| `tests/e2e`                     | Source and packaged Electron smoke tests                     |
| `scripts/setup.mts`             | Personalization command-line boundary                        |
| `scripts/setup`                 | Identity, icon, and repository personalization owners        |
| `docs/design`                   | Archived visual studies, not runtime documentation           |
| `electron-builder.yml`          | Package identity, Windows target, fuses, and artifact naming |
| `.github/workflows`             | Cross-platform source quality and Windows packaging evidence |

The renderer primitives are application-owned shadcn source. Use `pnpm exec shadcn add <name> --dry-run` before registry writes and review diffs before overwriting a locally customized component.

## Troubleshooting

### `pnpm dev` launches a blank or stale window

Confirm port `5173` is free and look for Doubleshot's renderer-ready message. The command removes `dist` before starting, so manually restoring old build output should not be necessary. Use `pnpm debug` when the main or preload prebuild does not complete.

### `pnpm setup:check` reports identity drift

Do not patch the failing string in isolation. Rerun `pnpm setup:dry-run` with the intended identity, review its complete file list, then use `pnpm setup:apply`. If a source file was intentionally redesigned, update the setup utility and its integration test so the new identity owner remains explicit.

### Setup reports an ambiguous or invalid icon

Use one conventional application filename such as `icon.svg`, keep installer icons as ICO files, and verify the input file is real rather than an image renamed to a different extension.

### Packaging cannot replace the unpacked executable

Close any running application from `release/win-unpacked` before packaging again. Playwright and Electron processes should terminate after tests, but a manually launched packaged application can keep its executable locked on Windows.

### Signed distribution fails

`pnpm dist:signed` is supposed to fail without valid `WIN_CSC_LINK` and `WIN_CSC_KEY_PASSWORD` values. Use `pnpm dist` for local unsigned installers. Never add certificate material or populated secret files to the repository.

## Safe extension sequence

When adding a product capability:

1. Define its owner and boundary contract.
2. Add the smallest end-to-end vertical slice.
3. Keep renderer access behind a narrow preload method.
4. Add boundary-level Vitest coverage.
5. Extend the Electron E2E test when behavior crosses process boundaries.
6. Run `pnpm check` and, when packaging is affected, `pnpm test:package`.
7. Update this manual when the capability introduces a new project-wide convention.

Optional modules and their activation rules are tracked in the [implementation plan](./plan.md). Windows release details and signing boundaries are in the [release guide](./releasing.md).
