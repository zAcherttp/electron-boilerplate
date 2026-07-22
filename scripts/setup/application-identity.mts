import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { z } from 'zod'

export const packageNameSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/, 'Package name must be an unscoped lowercase npm name')
export const executableNameSchema = z
  .string()
  .regex(
    /^[A-Za-z0-9][A-Za-z0-9._-]*$/,
    'Executable name may contain letters, numbers, dots, underscores, and hyphens',
  )
export const appIdSchema = z
  .string()
  .regex(
    /^[A-Za-z][A-Za-z0-9-]*(?:\.[A-Za-z][A-Za-z0-9-]*){2,}$/,
    'Application ID must be a reverse-DNS identifier such as com.example.my-app',
  )
export const versionSchema = z
  .string()
  .regex(
    /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/,
    'Version must be valid semantic versioning',
  )
export const productNameSchema = z
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

export const applicationIdentitySchema = z.object({
  appId: appIdSchema,
  author: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(200),
  executableName: executableNameSchema,
  packageName: packageNameSchema,
  productName: productNameSchema,
  version: versionSchema,
})

export type ApplicationIdentity = z.infer<typeof applicationIdentitySchema>

export function readYamlScalar(content: string, pattern: RegExp, label: string): string {
  const match = content.match(pattern)
  const rawValue = match?.[1]?.trim()
  if (!rawValue) throw new Error(`Could not read ${label} from electron-builder.yml`)
  if (!rawValue.startsWith('"')) return rawValue
  return z.string().parse(JSON.parse(rawValue))
}

export function setYamlScalar(
  content: string,
  pattern: RegExp,
  key: string,
  value: string,
): string {
  if (!pattern.test(content)) throw new Error(`Could not update ${key} in electron-builder.yml`)
  return content.replace(pattern, `${key}: ${JSON.stringify(value)}`)
}

export function setNestedYamlScalar(
  content: string,
  section: string,
  key: string,
  value: string,
): string {
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

export function readApplicationIdentity(
  root: string,
  readFile = (relativePath: string) => readFileSync(resolve(root, relativePath), 'utf8'),
): ApplicationIdentity {
  const packageFile = packageIdentitySchema.parse(JSON.parse(readFile('package.json')))
  const builder = readFile('electron-builder.yml')

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

export function slugifyProductName(productName: string): string {
  const slug = productName
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return packageNameSchema.parse(slug)
}
