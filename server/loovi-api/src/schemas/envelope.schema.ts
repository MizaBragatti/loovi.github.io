import { z } from 'zod'

export function envelopeSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().nullable(),
    data: dataSchema,
    timestamp: z.string(),
  })
}
