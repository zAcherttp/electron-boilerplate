import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import {
  applicationIdentitySchema,
  readApplicationIdentity,
  setNestedYamlScalar,
  setYamlScalar,
  type ApplicationIdentity,
} from './application-identity.mts'
import {
  discoverIcons,
  readRegisteredIconPaths,
  type IconRegistration,
} from './icon-registration.mts'

const repositoryFiles = {
  builder: 'electron-builder.yml',
  license: 'LICENSE',
  main: 'src/main/index.ts',
  manual: 'docs/project-manual.md',
  package: 'package.json',
  packageE2e: 'tests/e2e/package.e2e.ts',
  rendererE2e: 'tests/e2e/assert-application-window.ts',
  rendererHtml: 'src/renderer/index.html',
  releaseGuide: 'docs/releasing.md',
  readme: 'README.md',
  shortPlan: 'docs/plan.md',
  visualPlan: 'docs/plan.html',
  workflow: '.github/workflows/package-windows.yml',
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
  if (next !== current) plan.textFiles.set(relativePath, next)
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

  setPlannedText(plan, repositoryFiles.main, (content) => {
    let updated = replaceRequiredLiteral(content, current.appId, next.appId, repositoryFiles.main)
    updated = replaceRequiredLiteral(
      updated,
      `app.setName('${escapeSingleQuotedTypeScript(current.productName)}')`,
      `app.setName('${escapeSingleQuotedTypeScript(next.productName)}')`,
      repositoryFiles.main,
    )
    return updated
  })
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
  setPlannedText(plan, repositoryFiles.rendererE2e, (content) =>
    replaceRequiredLiteral(
      content,
      escapeSingleQuotedTypeScript(current.productName),
      escapeSingleQuotedTypeScript(next.productName),
      repositoryFiles.rendererE2e,
    ),
  )
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
      `- Package: \`${current.packageName}\``,
      `- Package: \`${next.packageName}\``,
      repositoryFiles.releaseGuide,
    )
    updated = replaceRequiredLiteral(
      updated,
      `- Application ID: \`${current.appId}\``,
      `- Application ID: \`${next.appId}\``,
      repositoryFiles.releaseGuide,
    )
    updated = replaceRequiredLiteral(
      updated,
      `- Executable: \`${current.executableName}.exe\``,
      `- Executable: \`${next.executableName}.exe\``,
      repositoryFiles.releaseGuide,
    )
    updated = replaceRequiredLiteral(
      updated,
      `- Version: \`${current.version}\``,
      `- Version: \`${next.version}\``,
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

function verifyPlannedRepository(
  plan: PlannedRepository,
  expectedIdentity?: ApplicationIdentity,
  iconSources: IconRegistration[] = [],
): SetupSummary {
  const identity = readApplicationIdentity(plan.root, (relativePath) =>
    readPlannedText(plan, relativePath),
  )
  const expected = expectedIdentity ?? identity

  for (const key of applicationIdentitySchema.keyof().options)
    if (identity[key] !== expected[key])
      throw new Error(
        `${key} is ${JSON.stringify(identity[key])}, expected ${JSON.stringify(expected[key])}`,
      )

  const checks: Array<[string, string]> = [
    [repositoryFiles.main, `setAppUserModelId('${escapeSingleQuotedTypeScript(identity.appId)}')`],
    [repositoryFiles.main, `app.setName('${escapeSingleQuotedTypeScript(identity.productName)}')`],
    [repositoryFiles.rendererHtml, `<title>${escapeHtml(identity.productName)}</title>`],
    [repositoryFiles.rendererE2e, escapeSingleQuotedTypeScript(identity.productName)],
    [repositoryFiles.packageE2e, `${identity.executableName}.exe`],
    [repositoryFiles.workflow, `${identity.packageName}-windows`],
    [repositoryFiles.license, identity.author],
    [repositoryFiles.releaseGuide, `- Package: \`${identity.packageName}\``],
    [repositoryFiles.releaseGuide, `- Product: \`${identity.productName}\``],
    [repositoryFiles.releaseGuide, `- Application ID: \`${identity.appId}\``],
    [repositoryFiles.releaseGuide, `- Executable: \`${identity.executableName}.exe\``],
    [repositoryFiles.releaseGuide, `- Version: \`${identity.version}\``],
  ]
  for (const [relativePath, registeredValue] of checks)
    if (!readPlannedText(plan, relativePath).includes(registeredValue))
      throw new Error(`${relativePath} is not registered with ${registeredValue}`)

  const registeredIcons = readRegisteredIconPaths(readPlannedText(plan, repositoryFiles.builder))
  for (const icon of registeredIcons)
    if (
      !plan.copiedFiles.has(icon.destination) &&
      !existsSync(resolve(plan.root, icon.destination))
    )
      throw new Error(`Registered ${icon.kind} icon does not exist: ${icon.destination}`)

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
  return verifyPlannedRepository({
    copiedFiles: new Map(),
    root: resolve(root),
    textFiles: new Map(),
  })
}

export function personalizeRepository(
  root: string,
  options: SetupApplicationOptions,
): SetupSummary {
  const repositoryRoot = resolve(root)
  const current = readApplicationIdentity(repositoryRoot)
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
