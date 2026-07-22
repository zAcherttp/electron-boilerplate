import { z } from 'zod'

export const applicationWindowStateSchema = z.object({
  appName: z.string().min(1),
  isFocused: z.boolean(),
  isMaximized: z.boolean(),
  usesNativeControls: z.boolean(),
})

export type ApplicationWindowState = z.infer<typeof applicationWindowStateSchema>
