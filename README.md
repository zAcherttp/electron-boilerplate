# Electron Boilerplate

An opinionated Electron foundation built with React, Vite, strict TypeScript, and an embedded Hono Application API. It is small enough to personalize in one command, but already carries the security, testing, packaging, logging, and desktop chrome that most applications eventually need.

## Included

- Electron 43 with sandboxing, context isolation, a secure `app://bundle` renderer, single-instance lifecycle, and package-time fuses
- React 19, Vite 8, Tailwind CSS v4, and shadcn/ui on Base UI
- packaged Geist and Geist Mono fonts with System, Light, and Dark appearance modes
- a custom, accessible Windows/Linux title bar and native macOS traffic lights
- TanStack Router and Query with reusable loading, error, and empty states
- an in-memory Hono API behind validated IPC and Zod contracts—no localhost server by default
- Pino development and packaged logging with redaction, rotation, and retention
- electron-builder Windows packaging with unsigned NSIS and signing-ready commands
- Oxfmt, Oxlint, TypeScript, Vitest, Playwright, and GitHub Actions behind one quality gate
- repository-wide application identity and icon personalization

## Start

Requirements: Node.js 22.18 or newer and Corepack.

```bash
corepack enable
pnpm install
pnpm dev
```

`packageManager` pins the repository's pnpm version. Vite is the single build entrypoint; vite-plugin-doubleshot builds Electron main and preload and manages development startup.

## Personalize

Preview and apply the application identity before building product features:

```bash
pnpm setup:dry-run -- --name "Northstar Desktop" --app-id com.example.northstar
pnpm setup:apply -- --name "Northstar Desktop" --app-id com.example.northstar
pnpm setup:check
```

Package and executable names are derived from the product name. Options can override the package, executable, version, description, author, and icon source. Pass `--icons <file-or-directory>`, or place conventionally named application and NSIS icons under `icons/` or `assets/icons/` for automatic discovery.

The command updates every repository-owned identity surface together. `pnpm setup:check` detects later drift and is part of CI. The [project manual](docs/project-manual.md#personalization-utility) documents every option and recognized icon name.

## Commands

| Command             | Purpose                                                        |
| ------------------- | -------------------------------------------------------------- |
| `pnpm dev`          | Start Vite and development Electron                            |
| `pnpm debug`        | Start development with Doubleshot diagnostics                  |
| `pnpm build`        | Create production main, preload, and renderer output           |
| `pnpm start`        | Build and launch production Electron                           |
| `pnpm check`        | Run setup, format, lint, type, unit, build, and Electron gates |
| `pnpm package`      | Create an unpacked Windows application                         |
| `pnpm test:package` | Package and smoke-test the unpacked application                |
| `pnpm dist`         | Create an unsigned NSIS installer                              |
| `pnpm dist:signed`  | Require signing credentials and create a signed installer      |

Use `pnpm format`, `pnpm lint:fix`, `pnpm typecheck`, `pnpm test`, and `pnpm test:e2e` when working on an individual gate.

## Architecture

```text
React renderer
  → narrow typed preload API
  → sender-validated Electron IPC
  → Electron main
  → typed Hono client over app.fetch()
  → local data, filesystem, or remote APIs
```

Hono runs in memory and does not open a port. Add a Node adapter only when a web client becomes a real second consumer. Keep product behavior with feature owners; contracts contain boundary schemas and data shapes, not workflows.

The renderer is intentionally untrusted. It cannot access raw Electron or Node APIs, navigation and permissions default to denied, and external HTTPS origins start with an empty allowlist in `src/main/start-application.ts`.

## Platform contract

Source-runtime quality and Electron smoke checks run on Windows, macOS, and Linux. The checked-in distribution contract remains Windows-only: electron-builder produces an unpacked application and an NSIS installer, and the packaged-runtime acceptance test targets that output.

macOS and Linux distributions are not claimed until they have platform metadata, icons, signing boundaries, artifact workflows, and packaged-runtime evidence.

## Documentation

- [Project manual](docs/project-manual.md) — setup, conventions, perks, quirks, and troubleshooting
- [Release guide](docs/releasing.md) — Windows packaging and signing boundary
- [Quick implementation plan](docs/plan.md) — concise status and optional modules
- [Visual implementation plan](docs/plan.html) — full historical plan and acceptance record
- [Title-bar design archive](docs/design/titlebar-playground.html) — the three original chrome studies

## License

[MIT](LICENSE)
