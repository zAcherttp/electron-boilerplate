# Windows packaging and release

The boilerplate produces an unpacked Windows application and an unsigned NSIS installer. Publishing is intentionally not configured: a product should choose its own release host, retention policy, signing identity, and rollout process.

## Replace the boilerplate identity

Preview and apply every identity surface together with the repository-owned setup command:

```bash
pnpm setup:dry-run -- --name "Northstar Desktop" --app-id com.example.northstar
pnpm setup:apply -- --name "Northstar Desktop" --app-id com.example.northstar
pnpm setup:check
```

Use `--icons <file-or-directory>` or an automatically discovered `icons/` or `assets/icons/` directory to register application and optional NSIS icons. Run `pnpm setup:apply -- --help` for the full naming and metadata options.

The command owns these identity surfaces:

1. Set `name`, `version`, `description`, and `author` in `package.json`.
2. Set `appId`, `productName`, and `win.executableName` in `electron-builder.yml`.
3. Keep the Windows App User Model ID in `src/main/index.ts` equal to `appId`.
4. Validate and register application, installer, and uninstaller icons under `build/`.
5. Update the document title in `src/renderer/index.html` and the corresponding E2E assertions.

Do not edit one surface in isolation. `pnpm setup:check`, also included in `pnpm check`, fails when the registered identity or icon files drift.

The checked-in identity is deliberately neutral:

- Package: `electron-boilerplate`
- Product: `Electron Boilerplate`
- Application ID: `dev.electron.boilerplate`
- Executable: `electron-boilerplate.exe`
- Version: `0.1.0`

## Local validation

Run the repository gate first, then exercise the packaged executable:

```bash
pnpm check
pnpm test:package
pnpm dist
```

`pnpm test:package` builds `release/win-unpacked/electron-boilerplate.exe`, starts that executable, and verifies the complete system-info vertical slice plus the packaged logging path and retention contract. The test adds a Chromium debugging flag only to its child process so Playwright can inspect the renderer; the application does not enable remote debugging itself, and the packaged Node-inspector fuse remains disabled.

`pnpm dist` creates the unsigned NSIS installer and block map in `release/`. Install the artifact on a disposable Windows profile before release and verify launch, removal, Start menu identity, taskbar icon, and the system-info screen.

## Signing readiness

Electron-builder discovers Windows signing credentials from environment variables. Store them in the CI provider's secret store; never add a certificate, password, or populated environment file to the repository.

- `WIN_CSC_LINK`: a certificate path or base64-encoded `.pfx` value.
- `WIN_CSC_KEY_PASSWORD`: the certificate password.

With those variables present, run:

```bash
pnpm dist:signed
```

The signed command enables electron-builder's `forceCodeSigning` option. It therefore fails instead of silently producing an unsigned release when credentials are missing or invalid. The ordinary `pnpm package` and `pnpm dist` commands intentionally remain unsigned-friendly for local development and pull-request checks.

The manual `Package Windows` GitHub Actions workflow exposes the same choice. Its `signed` input defaults to `false`; selecting it requires repository secrets named `WIN_CSC_LINK` and `WIN_CSC_KEY_PASSWORD`. Both paths run the repository gate and packaged-runtime smoke test before building the installer.

## Release boundary

The manual workflow uploads its installer only to the private workflow run as a short-lived build artifact. This repository does not create a GitHub Release or publish to an update feed. Add public release automation only after selecting a signing provider and release destination. Keep packaging, signing, publishing, and auto-update rollout as separate gates so a successful build cannot accidentally become a public release.
