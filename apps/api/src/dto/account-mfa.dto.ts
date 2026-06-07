import { z } from 'zod'

export const mfaConfirmBodySchema = z.object({
  totpCode: z.string().min(1),
})

export const mfaDisableBodySchema = z
  .object({
    totpCode: z.string().min(1).optional(),
    backupCode: z.string().min(1).optional(),
  })
  .refine((d) => !!(d.totpCode?.trim() || d.backupCode?.trim()), {
    message: 'totpCode or backupCode required',
  })

export const mfaRegenerateBackupBodySchema = z.object({
  totpCode: z.string().min(1),
})
