import { z } from 'zod'

export const systemInfoSchema = z.object({
  appVersion: z.string().min(1),
  architecture: z.string().min(1),
  platform: z.string().min(1),
  runtimeVersions: z.object({
    chrome: z.string().min(1),
    electron: z.string().min(1),
    node: z.string().min(1),
  }),
})

export type SystemInfo = z.infer<typeof systemInfoSchema>
