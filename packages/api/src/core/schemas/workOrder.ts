import { z } from 'zod'

export const workOrderCreateBodySchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  assetId: z.string().uuid().nullable().optional(),
  assignedEmployeeId: z.string().uuid().nullable().optional(),
  requestedAt: z.string().optional(),
  dueAt: z.string().optional(),
  completedAt: z.string().optional(),
})

export type WorkOrderCreateBody = z.infer<typeof workOrderCreateBodySchema>
