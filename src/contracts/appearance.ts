import { z } from 'zod'

export const themeSourceSchema = z.enum(['system', 'light', 'dark'])
export const resolvedThemeSchema = z.enum(['light', 'dark'])
export const appearanceStateSchema = z.object({
  resolved: resolvedThemeSchema,
  source: themeSourceSchema,
})

export type AppearanceState = z.infer<typeof appearanceStateSchema>
export type ResolvedTheme = z.infer<typeof resolvedThemeSchema>
export type ThemeSource = z.infer<typeof themeSourceSchema>
