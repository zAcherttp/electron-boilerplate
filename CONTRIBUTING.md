# Contributing

Thanks for your interest in improving Electron Boilerplate! This project is an
opinionated, secure foundation for building Electron applications with React,
Vite, TypeScript, Hono, and shadcn/ui.

## Prerequisites

- Node.js 22.18 or newer
- Corepack
- pnpm, pinned through `packageManager` in `package.json`

## Development Setup

```bash
git clone <repository-url>
cd electron-boilerplate
corepack enable
pnpm install --frozen-lockfile
pnpm setup:check
pnpm dev
```

`pnpm dev` starts the Vite renderer, Electron main process, preload, and the
internal Hono API.

> `pnpm setup:apply` personalizes a newly generated project. Contributors
> working on the boilerplate itself should not run it unless testing the setup
> workflow.

## Project Structure

```text
src/
  api/          → Internal Hono API
  main/         → Electron main process
  preload/      → Typed and restricted renderer bridge
  renderer/     → React application
  shared/       → Contracts shared across process boundaries

docs/           → Architecture, setup, planning, and release documentation
resources/      → Application icons and packaging resources
tests/          → Unit and Electron end-to-end tests
```

## Architecture Rules

- Keep the renderer browser-like; do not expose Node.js directly.
- Electron APIs belong in the main process.
- Renderer access must pass through the narrow, typed preload bridge.
- Validate data crossing IPC boundaries at runtime.
- The Hono API runs internally by default rather than opening an HTTP port.
- Preserve `contextIsolation`, sandboxing, navigation guards, and permission
  controls.
- Avoid `any`, unsafe casts, and workaround types.

## UI Conventions

- Support light, dark, and system themes.
- Preserve keyboard navigation, visible focus states, and accessible controls.
- Keep interactive title-bar elements outside draggable regions.
- Put reusable primitives in shared UI modules and feature composition near
  the owning feature.
- Check significant visual changes in both light and dark themes.

## Conventions

- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) —
  `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, or `chore:`
- **Branches:** `feat/`, `fix/`, `docs/`, `refactor/`, or `chore/`
- **Formatting:** Oxfmt
- **Linting:** Oxlint
- **Types:** Strict TypeScript
- **Dependencies:** Keep additions focused and explain why they belong in the
  boilerplate. Routine updates are managed by Renovate.

## Verification

Run the complete local quality gate before opening a pull request:

```bash
pnpm check
```

This checks personalization state, formatting, linting, types, unit tests, the
production build, and Electron end-to-end behavior.

For changes affecting packaging, native dependencies, protocols, or Electron
startup, also run:

```bash
pnpm test:package
```

## Pull Requests

Keep each pull request focused on one concern. Include:

- What changed and why
- How it was verified
- Any security, packaging, or platform impact
- Screenshots for visible UI changes
- Documentation updates when behavior or setup changes

All required checks must pass and review conversations must be resolved before
merging.

## Need Help?

Open an issue or discussion before starting a broad architecture, dependency,
security, or platform change. Small focused fixes can be submitted directly.

See the [project manual](docs/project-manual.md) for setup details and project
quirks.
