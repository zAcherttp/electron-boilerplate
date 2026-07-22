import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
import {
  appIdSchema,
  executableNameSchema,
  packageNameSchema,
  productNameSchema,
  readApplicationIdentity,
  slugifyProductName,
  versionSchema,
} from './setup/application-identity.mts'
import { iconSetupHelp } from './setup/icon-registration.mts'
import {
  inspectRepository,
  personalizeRepository,
  type SetupApplicationOptions,
  type SetupSummary,
} from './setup/personalize-repository.mts'

function printSummary(summary: SetupSummary, operation: 'check' | 'setup' = 'setup'): void {
  const heading =
    operation === 'check'
      ? 'Application registration check'
      : summary.dryRun
        ? 'Application setup preview'
        : 'Application setup'
  console.log(heading)
  console.log(`  App name:       ${summary.identity.productName}`)
  console.log(`  Application ID: ${summary.identity.appId}`)
  console.log(`  Package:        ${summary.identity.packageName}`)
  console.log(`  Executable:     ${summary.identity.executableName}.exe`)
  console.log(`  Version:        ${summary.identity.version}`)
  console.log(`  Author:         ${summary.identity.author}`)
  console.log('Registered icons')
  for (const icon of summary.icons)
    console.log(`  ${icon.kind.padEnd(11)} ${icon.destination} <- ${icon.source}`)
  if (operation === 'check') {
    console.log('Registration valid')
    return
  }
  console.log(summary.dryRun ? 'Would update' : 'Updated')
  for (const file of summary.changedFiles) console.log(`  ${file}`)
  if (!summary.dryRun) console.log('Next: pnpm format && pnpm check && pnpm test:package')
}

function printHelp(): void {
  console.log(`Personalize the Electron application

Usage:
  pnpm setup:apply -- --name "My App" --app-id com.example.my-app [options]
  pnpm setup:dry-run -- --name "My App" --app-id com.example.my-app [options]
  pnpm setup:check

Options:
  --name <name>               Required product name
  --app-id <reverse-dns>      Required application ID
  --package-name <name>       Defaults to a slug derived from --name
  --executable <name>         Defaults to --package-name
  --version <semver>          Defaults to the current version
  --description <text>        Defaults to the current description
  --author <text>             Defaults to the current author
  --icons <file-or-directory> Application and optional installer icons
  --dry-run                   Validate and print changes without writing
  --check                     Validate and print the current registration
  --help                      Show this help

Automatic icon directories, in order: ${iconSetupHelp.autoIconDirectories.join(', ')}
Application icon precedence: ${iconSetupHelp.applicationIconNames.join(', ')}
Optional installer names: installerIcon.ico, installer.ico, uninstallerIcon.ico, uninstaller.ico`)
}

function runCli(): void {
  const { values } = parseArgs({
    options: {
      'app-id': { type: 'string' },
      author: { type: 'string' },
      check: { type: 'boolean', default: false },
      description: { type: 'string' },
      'dry-run': { type: 'boolean', default: false },
      executable: { type: 'string' },
      help: { type: 'boolean', default: false },
      icons: { type: 'string' },
      name: { type: 'string' },
      'package-name': { type: 'string' },
      version: { type: 'string' },
    },
    strict: true,
  })
  const root = process.cwd()

  if (values.help) {
    printHelp()
    return
  }
  if (values.check) {
    printSummary(inspectRepository(root), 'check')
    return
  }

  const current = readApplicationIdentity(root)
  const productName = productNameSchema.parse(values.name)
  const packageName = packageNameSchema.parse(
    values['package-name'] ?? slugifyProductName(productName),
  )
  const options: SetupApplicationOptions = {
    appId: appIdSchema.parse(values['app-id']),
    author: values.author ?? current.author,
    description: values.description ?? current.description,
    dryRun: values['dry-run'],
    executableName: executableNameSchema.parse(values.executable ?? packageName),
    iconInput: values.icons ?? null,
    packageName,
    productName,
    version: versionSchema.parse(values.version ?? current.version),
  }

  printSummary(personalizeRepository(root, options))
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(resolve(entryPath)).href) {
  process.once('uncaughtException', (error: Error) => {
    console.error(`Setup failed: ${error.message}`)
    process.exitCode = 1
  })
  runCli()
}
