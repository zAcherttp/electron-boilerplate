import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { inspectRepository, personalizeRepository } from './setup.mts'

const ownedTemplateFiles = [
  '.github/workflows/package-windows.yml',
  'build/icon.svg',
  'docs/plan.html',
  'docs/plan.md',
  'docs/project-manual.md',
  'docs/releasing.md',
  'electron-builder.yml',
  'LICENSE',
  'package.json',
  'README.md',
  'src/api/create-api-client.test.ts',
  'src/api/create-api.test.ts',
  'src/main/index.ts',
  'src/main/logging/create-application-logger.test.ts',
  'src/renderer/app/router.tsx',
  'src/renderer/features/system-info/system-info-page.test.tsx',
  'src/renderer/index.html',
  'tests/e2e/assert-application-window.ts',
  'tests/e2e/package.e2e.ts',
]

const personalizedPackageSchema = z.object({
  author: z.string(),
  description: z.string(),
  name: z.string(),
  version: z.string(),
})

function copyFixtureFile(root: string, relativePath: string): void {
  const destination = resolve(root, relativePath)
  mkdirSync(dirname(destination), { recursive: true })
  copyFileSync(resolve(process.cwd(), relativePath), destination)
}

function readFixtureFile(root: string, relativePath: string): string {
  return readFileSync(resolve(root, relativePath), 'utf8')
}

function createIconInputs(root: string): void {
  const iconDirectory = resolve(root, 'icons')
  mkdirSync(iconDirectory, { recursive: true })
  writeFileSync(
    resolve(iconDirectory, 'icon.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M0 0h32v32H0z"/></svg>',
    'utf8',
  )
  writeFileSync(resolve(iconDirectory, 'installer.ico'), Buffer.from([0, 0, 1, 0, 1, 0]))
  writeFileSync(resolve(iconDirectory, 'uninstaller.ico'), Buffer.from([0, 0, 1, 0, 1, 0]))
}

describe('application setup', () => {
  let fixtureRoot = ''

  beforeEach(() => {
    fixtureRoot = mkdtempSync(join(tmpdir(), 'electron-boilerplate-setup-'))
    for (const relativePath of ownedTemplateFiles) copyFixtureFile(fixtureRoot, relativePath)
    createIconInputs(fixtureRoot)
  })

  afterEach(() => {
    rmSync(fixtureRoot, { force: true, recursive: true })
  })

  it('personalizes every registered identity surface and auto-detects icons', () => {
    const summary = personalizeRepository(fixtureRoot, {
      appId: 'com.example.northstar',
      author: 'Northstar contributors',
      description: 'A focused desktop application',
      dryRun: false,
      executableName: 'northstar',
      iconInput: null,
      packageName: 'northstar-desktop',
      productName: 'Northstar Desktop',
      version: '1.2.3',
    })

    expect(summary.identity).toEqual({
      appId: 'com.example.northstar',
      author: 'Northstar contributors',
      description: 'A focused desktop application',
      executableName: 'northstar',
      packageName: 'northstar-desktop',
      productName: 'Northstar Desktop',
      version: '1.2.3',
    })
    expect(summary.icons.map(({ destination, kind }) => ({ destination, kind }))).toEqual([
      { destination: 'build/icon.svg', kind: 'application' },
      { destination: 'build/installerIcon.ico', kind: 'installer' },
      { destination: 'build/uninstallerIcon.ico', kind: 'uninstaller' },
    ])

    const packageFile = personalizedPackageSchema.parse(
      JSON.parse(readFixtureFile(fixtureRoot, 'package.json')),
    )
    expect(packageFile).toMatchObject({
      author: 'Northstar contributors',
      description: 'A focused desktop application',
      name: 'northstar-desktop',
      version: '1.2.3',
    })
    expect(readFixtureFile(fixtureRoot, 'electron-builder.yml')).toContain(
      'appId: "com.example.northstar"',
    )
    expect(readFixtureFile(fixtureRoot, 'electron-builder.yml')).toContain(
      'productName: "Northstar Desktop"',
    )
    expect(readFixtureFile(fixtureRoot, 'src/main/index.ts')).toContain(
      "setAppUserModelId('com.example.northstar')",
    )
    expect(readFixtureFile(fixtureRoot, 'src/main/index.ts')).toContain(
      "app.setName('Northstar Desktop')",
    )
    expect(readFixtureFile(fixtureRoot, 'src/renderer/index.html')).toContain(
      '<title>Northstar Desktop</title>',
    )
    expect(readFileSync(resolve(fixtureRoot, 'build/installerIcon.ico'))).toEqual(
      Buffer.from([0, 0, 1, 0, 1, 0]),
    )
    expect(inspectRepository(fixtureRoot).identity).toEqual(summary.identity)
  })

  it('previews the complete change without writing to the repository', () => {
    const originalPackage = readFixtureFile(fixtureRoot, 'package.json')
    const originalBuilder = readFixtureFile(fixtureRoot, 'electron-builder.yml')

    const summary = personalizeRepository(fixtureRoot, {
      appId: 'com.example.preview',
      author: 'Preview contributors',
      description: 'A setup preview',
      dryRun: true,
      executableName: 'preview-app',
      iconInput: null,
      packageName: 'preview-app',
      productName: 'Preview App',
      version: '2.0.0',
    })

    expect(summary.dryRun).toBe(true)
    expect(summary.changedFiles).toContain('package.json')
    expect(summary.changedFiles).toContain('build/installerIcon.ico')
    expect(readFixtureFile(fixtureRoot, 'package.json')).toBe(originalPackage)
    expect(readFixtureFile(fixtureRoot, 'electron-builder.yml')).toBe(originalBuilder)
  })

  it('rejects an invalid icon before changing identity files', () => {
    const originalPackage = readFixtureFile(fixtureRoot, 'package.json')
    writeFileSync(resolve(fixtureRoot, 'icons/icon.svg'), 'not an svg', 'utf8')

    expect(() =>
      personalizeRepository(fixtureRoot, {
        appId: 'com.example.invalid-icon',
        author: 'Example contributors',
        description: 'An invalid icon example',
        dryRun: false,
        executableName: 'invalid-icon',
        iconInput: null,
        packageName: 'invalid-icon',
        productName: 'Invalid Icon',
        version: '1.0.0',
      }),
    ).toThrow(/Invalid SVG icon/)
    expect(readFixtureFile(fixtureRoot, 'package.json')).toBe(originalPackage)
  })
})
