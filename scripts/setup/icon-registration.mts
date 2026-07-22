import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, resolve } from 'node:path'
import { z } from 'zod'
import { readYamlScalar } from './application-identity.mts'

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

export interface IconRegistration {
  destination: string
  kind: 'application' | 'installer' | 'uninstaller'
  source: string
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

export function discoverIcons(root: string, configuredInput: string | null): IconRegistration[] {
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

export function readRegisteredIconPaths(builder: string): IconRegistration[] {
  const applicationIcon = readYamlScalar(builder, /^  icon:\s*(.+)$/m, 'win.icon')
  const registrations: IconRegistration[] = [
    { destination: applicationIcon, kind: 'application', source: applicationIcon },
  ]
  const installer = builder.match(/^  installerIcon:\s*(.+)$/m)?.[1]?.trim()
  const uninstaller = builder.match(/^  uninstallerIcon:\s*(.+)$/m)?.[1]?.trim()

  if (installer) {
    const path = readYamlScalar(builder, /^  installerIcon:\s*(.+)$/m, 'nsis.installerIcon')
    registrations.push({ destination: path, kind: 'installer', source: path })
  }
  if (uninstaller) {
    const path = readYamlScalar(builder, /^  uninstallerIcon:\s*(.+)$/m, 'nsis.uninstallerIcon')
    registrations.push({ destination: path, kind: 'uninstaller', source: path })
  }
  return registrations
}

export const iconSetupHelp = {
  applicationIconNames,
  autoIconDirectories,
}
