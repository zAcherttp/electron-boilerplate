import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, extname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
import { z } from 'zod'

const autoIconDirectories = ['icons', 'assets/icons']
const applicationIconNames = [
  'icon.svg',
  'app.svg',
  'application.svg',
  'icon.png',
  'app.png',
  'application.png',
  'icon.ico',
  'app.ico',
  'application.ico',
]
const supportedApplicationIconExtensions = ['.svg', '.png', '.ico']
const repositoryFiles = {
  builder: 'electron-builder.yml',
  loggerTest: 'src/main/logging/create-application-logger.test.ts',
  license: 'LICENSE',
  main: 'src/main/index.ts',
  manual: 'docs/project-manual.md',
  package: 'package.json',
  packageE2e: 'tests/e2e/package.e2e.ts',
  rendererE2e: 'tests/e2e/assert-application-window.ts',
  rendererHtml: 'src/renderer/index.html',
  rendererRouter: 'src/renderer/app/router.tsx',
  releaseGuide: 'docs/releasing.md',
  readme: 'README.md',
  shortPlan: 'docs/plan.md',
  visualPlan: 'docs/plan.html',
  workflow: '.github/workflows/package-windows.yml',
}
const versionFixtureFiles = [
  'src/api/create-api.test.ts',
  'src/api/create-api-client.test.ts',
  'src/renderer/features/system-info/system-info-page.test.tsx',
]

const packageNameSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/, 'Package name must be an unscoped lowercase npm name')
const executableNameSchema = z
  .string()
  .regex(
    /^[A-Za-z0-9][A-Za-z0-9._-]*$/,
    'Executable name may contain letters, numbers, dots, underscores, and hyphens',
  )
const appIdSchema = z
  .string()
  .regex(
    /^[A-Za-z][A-Za-z0-9-]*(?:\.[A-Za-z][A-Za-z0-9-]*){2,}$/,
    'Application ID must be a reverse-DNS identifier such as com.example.my-app',
  )
const versionSchema = z
  .string()
  .regex(
    /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/,
    'Version must be valid semantic versioning',
  )
const productNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .refine(
    (value) =>
      [...value].every((character) => {
        const codePoint = character.codePointAt(0)
        return codePoint !== undefined && codePoint >= 32 && codePoint !== 127
      }),
    'App name contains control characters',
  )

const packageIdentitySchema = z.object({
  author: z.string(),
  description: z.string(),
  name: packageNameSchema,
  version: versionSchema,
})

const applicationIdentitySchema = z.object({
  appId: appIdSchema,
  author: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(200),
  executableName: executableNameSchema,
  packageName: packageNameSchema,
  productName: productNameSchema,
  version: versionSchema,
})

type ApplicationIdentity = z.infer<typeof applicationIdentitySchema>

interface IconRegistration {
  destination: string
  kind: 'application' | 'installer' | 'uninstaller'
  source: string
}

export interface SetupApplicationOptions {
  appId: string
  author: string
  description: string
  dryRun: boolean
  executableName: string
  iconInput: string | null
  packageName: string
  productName: string
  version: string
}

export interface SetupSummary {
  changedFiles: string[]
  dryRun: boolean
  identity: ApplicationIdentity
  icons: IconRegistration[]
}

interface PlannedRepository {
  copiedFiles: Map<string, string>
  root: string
  textFiles: Map<string, string>
}

function readText(root: string, relativePath: string): string {
  const absolutePath = resolve(root, relativePath)
  if (!existsSync(absolutePath))
    throw new Error(`Required template file is missing: ${relativePath}`)
  return readFileSync(absolutePath, 'utf8')
}

function readPlannedText(plan: PlannedRepository, relativePath: string): string {
  return plan.textFiles.get(relativePath) ?? readText(plan.root, relativePath)
}

function setPlannedText(
  plan: PlannedRepository,
  relativePath: string,
  transform: (content: string) => string,
): void {
  const current = readPlannedText(plan, relativePath)
  const next = transform(current)
  if (next === current) return
  plan.textFiles.set(relativePath, next)
}

function replaceRequiredLiteral(
  content: string,
  currentValue: string,
  nextValue: string,
  owner: string,
): string {
  if (currentValue === nextValue) return content
  if (!content.includes(currentValue))
    throw new Error(
      `${owner} does not contain the registered value ${JSON.stringify(currentValue)}`,
    )
  return content.split(currentValue).join(nextValue)
}

function replaceOptionalLiteral(content: string, currentValue: string, nextValue: string): string {
  if (currentValue === nextValue || !content.includes(currentValue)) return content
  return content.split(currentValue).join(nextValue)
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function escapeSingleQuotedTypeScript(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")
}

function readYamlScalar(content: string, pattern: RegExp, label: string): string {
  const match = content.match(pattern)
  const rawValue = match?.[1]?.trim()
  if (!rawValue) throw new Error(`Could not read ${label} from electron-builder.yml`)
  if (!rawValue.startsWith('"')) return rawValue
  return z.string().parse(JSON.parse(rawValue))
}

function setYamlScalar(content: string, pattern: RegExp, key: string, value: string): string {
  if (!pattern.test(content)) throw new Error(`Could not update ${key} in electron-builder.yml`)
  return content.replace(pattern, `${key}: ${JSON.stringify(value)}`)
}

function setNestedYamlScalar(content: string, section: string, key: string, value: string): string {
  const existingPattern = new RegExp(`^  ${key}:\\s*.*$`, 'm')
  if (existingPattern.test(content))
    return content.replace(existingPattern, `  ${key}: ${JSON.stringify(value)}`)

  const sectionMarker = `${section}:\n`
  if (content.includes(sectionMarker))
    return content.replace(sectionMarker, `${sectionMarker}  ${key}: ${JSON.stringify(value)}\n`)

  const artifactMarker = 'artifactName:'
  if (!content.includes(artifactMarker))
    throw new Error(
      `Could not register ${key}; electron-builder.yml has no ${section} or artifactName`,
    )
  return content.replace(
    artifactMarker,
    `${section}:\n  ${key}: ${JSON.stringify(value)}\n\n${artifactMarker}`,
  )
}

function readIdentity(
  root: string,
  readFile = (relativePath: string) => readText(root, relativePath),
): ApplicationIdentity {
  const packageFile = packageIdentitySchema.parse(JSON.parse(readFile(repositoryFiles.package)))
  const builder = readFile(repositoryFiles.builder)

  return applicationIdentitySchema.parse({
    appId: appIdSchema.parse(readYamlScalar(builder, /^appId:\s*(.+)$/m, 'appId')),
    author: packageFile.author,
    description: packageFile.description,
    executableName: executableNameSchema.parse(
      readYamlScalar(builder, /^  executableName:\s*(.+)$/m, 'win.executableName'),
    ),
    packageName: packageFile.name,
    productName: productNameSchema.parse(
      readYamlScalar(builder, /^productName:\s*(.+)$/m, 'productName'),
    ),
    version: packageFile.version,
  })
}

function replacePackageProperty(
  content: string,
  property: string,
  currentValue: string,
  nextValue: string,
): string {
  return replaceRequiredLiteral(
    content,
    `  "${property}": ${JSON.stringify(currentValue)}`,
    `  "${property}": ${JSON.stringify(nextValue)}`,
    `package.json ${property}`,
  )
}

function slugifyProductName(productName: string): string {
  const slug = productName
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return packageNameSchema.parse(slug)
}

function validateIconFile(filePath: string): void {
  const extension = extname(filePath).toLowerCase()
  const content = readFileSync(filePath)

  if (extension === '.svg') {
    if (!content.toString('utf8').includes('<svg')) throw new Error(`Invalid SVG icon: ${filePath}`)
    return
  }

  if (extension === '.png') {
    const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
    if (content.length < pngSignature.length || !content.subarray(0, 8).equals(pngSignature))
      throw new Error(`Invalid PNG icon: ${filePath}`)
    return
  }

  if (extension === '.ico') {
    const icoSignature = Buffer.from([0, 0, 1, 0])
    if (content.length < icoSignature.length || !content.subarray(0, 4).equals(icoSignature))
      throw new Error(`Invalid ICO icon: ${filePath}`)
    return
  }

  throw new Error(`Unsupported icon format: ${filePath}`)
}

function findNamedFile(directory: string, names: string[]): string | null {
  const files = readdirSync(directory, { withFileTypes: true }).filter((entry) => entry.isFile())

  for (const name of names) {
    const match = files.find((entry) => entry.name.toLowerCase() === name.toLowerCase())
    if (match) return resolve(directory, match.name)
  }

  return null
}

function findApplicationIcon(directory: string): string | null {
  const namedIcon = findNamedFile(directory, applicationIconNames)
  if (namedIcon) return namedIcon

  const supportedFiles = readdirSync(directory, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        supportedApplicationIconExtensions.includes(extname(entry.name).toLowerCase()) &&
        !entry.name.toLowerCase().includes('installer'),
    )
    .map((entry) => resolve(directory, entry.name))

  if (supportedFiles.length === 1) return supportedFiles[0] ?? null
  if (supportedFiles.length > 1)
    throw new Error(
      `Icon directory is ambiguous. Name the application icon icon.svg, icon.png, or icon.ico: ${directory}`,
    )
  return null
}

function resolveIconInput(root: string, configuredInput: string | null): string | null {
  if (configuredInput) {
    const absoluteInput = resolve(root, configuredInput)
    if (!existsSync(absoluteInput)) throw new Error(`Icon input does not exist: ${configuredInput}`)
    return absoluteInput
  }

  for (const candidate of autoIconDirectories) {
    const absoluteCandidate = resolve(root, candidate)
    if (existsSync(absoluteCandidate) && statSync(absoluteCandidate).isDirectory())
      return absoluteCandidate
  }

  return null
}

function discoverIcons(root: string, configuredInput: string | null): IconRegistration[] {
  const iconInput = resolveIconInput(root, configuredInput)
  if (!iconInput) return []

  if (statSync(iconInput).isFile()) {
    validateIconFile(iconInput)
    return [
      {
        destination: `build/icon${extname(iconInput).toLowerCase()}`,
        kind: 'application',
        source: iconInput,
      },
    ]
  }

  const registrations: IconRegistration[] = []
  const applicationIcon = findApplicationIcon(iconInput)
  const installerIcon = findNamedFile(iconInput, ['installerIcon.ico', 'installer.ico'])
  const uninstallerIcon = findNamedFile(iconInput, ['uninstallerIcon.ico', 'uninstaller.ico'])

  if (applicationIcon)
    registrations.push({
      destination: `build/icon${extname(applicationIcon).toLowerCase()}`,
      kind: 'application',
      source: applicationIcon,
    })
  if (installerIcon)
    registrations.push({
      destination: 'build/installerIcon.ico',
      kind: 'installer',
      source: installerIcon,
    })
  if (uninstallerIcon)
    registrations.push({
      destination: 'build/uninstallerIcon.ico',
      kind: 'uninstaller',
      source: uninstallerIcon,
    })

  if (registrations.length === 0)
    throw new Error(`No supported application or installer icons found in ${iconInput}`)
  for (const registration of registrations) validateIconFile(registration.source)
  return registrations
}

function registeredIconPaths(builder: string): IconRegistration[] {
  const applicationIcon = readYamlScalar(builder, /^  icon:\s*(.+)$/m, 'win.icon')
  const registrations: IconRegistration[] = [
    {
      destination: applicationIcon,
      kind: 'application',
      source: applicationIcon,
    },
  ]
  const installer = builder.match(/^  installerIcon:\s*(.+)$/m)?.[1]?.trim()
  const uninstaller = builder.match(/^  uninstallerIcon:\s*(.+)$/m)?.[1]?.trim()

  if (installer) {
    const path = installer.startsWith('"') ? z.string().parse(JSON.parse(installer)) : installer
    registrations.push({ destination: path, kind: 'installer', source: path })
  }
  if (uninstaller) {
    const path = uninstaller.startsWith('"')
      ? z.string().parse(JSON.parse(uninstaller))
      : uninstaller
    registrations.push({ destination: path, kind: 'uninstaller', source: path })
  }

  return registrations
}

function planIdentityUpdates(
  plan: PlannedRepository,
  current: ApplicationIdentity,
  next: ApplicationIdentity,
): void {
  setPlannedText(plan, repositoryFiles.package, (content) => {
    let updated = replacePackageProperty(content, 'name', current.packageName, next.packageName)
    updated = replacePackageProperty(updated, 'version', current.version, next.version)
    updated = replacePackageProperty(updated, 'description', current.description, next.description)
    return replacePackageProperty(updated, 'author', current.author, next.author)
  })

  setPlannedText(plan, repositoryFiles.builder, (content) => {
    let updated = setYamlScalar(content, /^appId:\s*.*$/m, 'appId', next.appId)
    updated = setYamlScalar(updated, /^productName:\s*.*$/m, 'productName', next.productName)
    return setYamlScalar(
      updated,
      /^  executableName:\s*.*$/m,
      '  executableName',
      next.executableName,
    )
  })

  setPlannedText(plan, repositoryFiles.main, (content) =>
    replaceRequiredLiteral(content, current.appId, next.appId, repositoryFiles.main),
  )
  setPlannedText(plan, repositoryFiles.license, (content) =>
    replaceRequiredLiteral(content, current.author, next.author, repositoryFiles.license),
  )
  setPlannedText(plan, repositoryFiles.rendererHtml, (content) =>
    replaceRequiredLiteral(
      content,
      `<title>${escapeHtml(current.productName)}</title>`,
      `<title>${escapeHtml(next.productName)}</title>`,
      repositoryFiles.rendererHtml,
    ),
  )
  setPlannedText(plan, repositoryFiles.rendererRouter, (content) =>
    replaceRequiredLiteral(
      content,
      escapeHtml(current.productName),
      escapeHtml(next.productName),
      repositoryFiles.rendererRouter,
    ),
  )
  setPlannedText(plan, repositoryFiles.rendererE2e, (content) => {
    let updated = replaceRequiredLiteral(
      content,
      escapeSingleQuotedTypeScript(current.productName),
      escapeSingleQuotedTypeScript(next.productName),
      repositoryFiles.rendererE2e,
    )
    return replaceRequiredLiteral(
      updated,
      escapeSingleQuotedTypeScript(current.version),
      escapeSingleQuotedTypeScript(next.version),
      repositoryFiles.rendererE2e,
    )
  })
  setPlannedText(plan, repositoryFiles.packageE2e, (content) =>
    replaceRequiredLiteral(
      content,
      `${current.executableName}.exe`,
      `${next.executableName}.exe`,
      repositoryFiles.packageE2e,
    ),
  )
  setPlannedText(plan, repositoryFiles.workflow, (content) =>
    replaceRequiredLiteral(
      content,
      `${current.packageName}-windows`,
      `${next.packageName}-windows`,
      repositoryFiles.workflow,
    ),
  )

  for (const relativePath of versionFixtureFiles)
    setPlannedText(plan, relativePath, (content) =>
      replaceRequiredLiteral(content, current.version, next.version, relativePath),
    )

  setPlannedText(plan, repositoryFiles.loggerTest, (content) =>
    replaceRequiredLiteral(
      content,
      current.packageName,
      next.packageName,
      repositoryFiles.loggerTest,
    ),
  )

  for (const relativePath of [
    repositoryFiles.readme,
    repositoryFiles.manual,
    repositoryFiles.shortPlan,
    repositoryFiles.visualPlan,
  ])
    setPlannedText(plan, relativePath, (content) => {
      let updated = replaceOptionalLiteral(content, current.productName, next.productName)
      return replaceOptionalLiteral(updated, current.packageName, next.packageName)
    })

  setPlannedText(plan, repositoryFiles.releaseGuide, (content) => {
    let updated = replaceRequiredLiteral(
      content,
      current.productName,
      next.productName,
      repositoryFiles.releaseGuide,
    )
    updated = replaceRequiredLiteral(
      updated,
      `| Package        | \`${current.packageName}\``,
      `| Package        | \`${next.packageName}\``,
      repositoryFiles.releaseGuide,
    )
    updated = replaceRequiredLiteral(
      updated,
      `| Application ID | \`${current.appId}\``,
      `| Application ID | \`${next.appId}\``,
      repositoryFiles.releaseGuide,
    )
    updated = replaceRequiredLiteral(
      updated,
      `| Executable     | \`${current.executableName}.exe\``,
      `| Executable     | \`${next.executableName}.exe\``,
      repositoryFiles.releaseGuide,
    )
    updated = replaceRequiredLiteral(
      updated,
      `| Version        | \`${current.version}\``,
      `| Version        | \`${next.version}\``,
      repositoryFiles.releaseGuide,
    )
    return replaceRequiredLiteral(
      updated,
      `release/win-unpacked/${current.executableName}.exe`,
      `release/win-unpacked/${next.executableName}.exe`,
      repositoryFiles.releaseGuide,
    )
  })
}

function planIconUpdates(plan: PlannedRepository, icons: IconRegistration[]): void {
  if (icons.length === 0) return

  for (const icon of icons) {
    const destination = resolve(plan.root, icon.destination)
    const source = resolve(icon.source)
    const alreadyMatches =
      source === destination ||
      (existsSync(destination) && readFileSync(source).equals(readFileSync(destination)))
    if (!alreadyMatches) plan.copiedFiles.set(icon.destination, source)
  }

  setPlannedText(plan, repositoryFiles.builder, (content) => {
    let updated = content
    const applicationIcon = icons.find((icon) => icon.kind === 'application')
    const installerIcon = icons.find((icon) => icon.kind === 'installer')
    const uninstallerIcon = icons.find((icon) => icon.kind === 'uninstaller')

    if (applicationIcon)
      updated = setNestedYamlScalar(updated, 'win', 'icon', applicationIcon.destination)
    if (installerIcon)
      updated = setNestedYamlScalar(updated, 'nsis', 'installerIcon', installerIcon.destination)
    if (uninstallerIcon)
      updated = setNestedYamlScalar(updated, 'nsis', 'uninstallerIcon', uninstallerIcon.destination)
    return updated
  })
}

function plannedFileExists(plan: PlannedRepository, relativePath: string): boolean {
  return plan.copiedFiles.has(relativePath) || existsSync(resolve(plan.root, relativePath))
}

function verifyPlannedRepository(
  plan: PlannedRepository,
  expectedIdentity?: ApplicationIdentity,
  iconSources: IconRegistration[] = [],
): SetupSummary {
  const identity = readIdentity(plan.root, (relativePath) => readPlannedText(plan, relativePath))
  const expected = expectedIdentity ?? identity

  for (const key of applicationIdentitySchema.keyof().options)
    if (identity[key] !== expected[key])
      throw new Error(
        `${key} is ${JSON.stringify(identity[key])}, expected ${JSON.stringify(expected[key])}`,
      )

  const checks: Array<[string, string]> = [
    [repositoryFiles.main, `setAppUserModelId('${escapeSingleQuotedTypeScript(identity.appId)}')`],
    [repositoryFiles.rendererHtml, `<title>${escapeHtml(identity.productName)}</title>`],
    [repositoryFiles.rendererRouter, escapeHtml(identity.productName)],
    [repositoryFiles.rendererE2e, escapeSingleQuotedTypeScript(identity.productName)],
    [repositoryFiles.rendererE2e, escapeSingleQuotedTypeScript(identity.version)],
    [repositoryFiles.packageE2e, `${identity.executableName}.exe`],
    [repositoryFiles.workflow, `${identity.packageName}-windows`],
    [repositoryFiles.loggerTest, identity.packageName],
    [repositoryFiles.license, identity.author],
    [repositoryFiles.releaseGuide, `| Package        | \`${identity.packageName}\``],
    [repositoryFiles.releaseGuide, `| Product        | \`${identity.productName}\``],
    [repositoryFiles.releaseGuide, `| Application ID | \`${identity.appId}\``],
    [repositoryFiles.releaseGuide, `| Executable     | \`${identity.executableName}.exe\``],
    [repositoryFiles.releaseGuide, `| Version        | \`${identity.version}\``],
  ]
  for (const relativePath of versionFixtureFiles) checks.push([relativePath, identity.version])

  for (const [relativePath, registeredValue] of checks) {
    if (!readPlannedText(plan, relativePath).includes(registeredValue))
      throw new Error(`${relativePath} is not registered with ${registeredValue}`)
  }

  const registeredIcons = registeredIconPaths(readPlannedText(plan, repositoryFiles.builder))
  for (const icon of registeredIcons) {
    if (!plannedFileExists(plan, icon.destination))
      throw new Error(`Registered ${icon.kind} icon does not exist: ${icon.destination}`)
  }
  const icons = registeredIcons.map((registeredIcon) => {
    const discoveredIcon = iconSources.find(
      (icon) =>
        icon.kind === registeredIcon.kind && icon.destination === registeredIcon.destination,
    )
    return discoveredIcon ?? registeredIcon
  })

  return {
    changedFiles: [
      ...plan.textFiles.keys(),
      ...[...plan.copiedFiles.keys()].filter((path) => !plan.textFiles.has(path)),
    ].sort(),
    dryRun: false,
    icons,
    identity,
  }
}

function writePlan(plan: PlannedRepository): void {
  for (const [relativePath, content] of plan.textFiles) {
    const absolutePath = resolve(plan.root, relativePath)
    mkdirSync(dirname(absolutePath), { recursive: true })
    writeFileSync(absolutePath, content, 'utf8')
  }

  for (const [relativePath, source] of plan.copiedFiles) {
    const absoluteDestination = resolve(plan.root, relativePath)
    if (resolve(source) === absoluteDestination) continue
    mkdirSync(dirname(absoluteDestination), { recursive: true })
    copyFileSync(source, absoluteDestination)
  }
}

export function inspectRepository(root: string): SetupSummary {
  const plan: PlannedRepository = {
    copiedFiles: new Map(),
    root: resolve(root),
    textFiles: new Map(),
  }
  return verifyPlannedRepository(plan)
}

export function personalizeRepository(
  root: string,
  options: SetupApplicationOptions,
): SetupSummary {
  const repositoryRoot = resolve(root)
  const current = readIdentity(repositoryRoot)
  const next = applicationIdentitySchema.parse(options)
  const icons = discoverIcons(repositoryRoot, options.iconInput)
  const plan: PlannedRepository = {
    copiedFiles: new Map(),
    root: repositoryRoot,
    textFiles: new Map(),
  }

  planIdentityUpdates(plan, current, next)
  planIconUpdates(plan, icons)

  const summary = verifyPlannedRepository(plan, next, icons)
  summary.dryRun = options.dryRun
  if (!options.dryRun) writePlan(plan)
  return summary
}

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

Automatic icon directories, in order: ${autoIconDirectories.join(', ')}
Application icon precedence: ${applicationIconNames.join(', ')}
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

  const current = readIdentity(root)
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
