import { z } from 'zod'

/** Response: member in list (with optional storeIds for USER role) */
export type MemberResponse = {
  id: string
  userId: string
  email: string
  firstName: string
  lastName: string
  name: string
  membershipRole: string
  createdAt: Date
  storeIds?: string[]
}

/** Input: create member (user + add to company) */
export const createMemberBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  membershipRole: z.enum(['ADMIN', 'USER']),
  storeIds: z.array(z.string().uuid()).optional(),
})

export type CreateMemberBody = z.infer<typeof createMemberBodySchema>

/** Input: update member stores (USER only) */
export const updateMemberStoresBodySchema = z.object({
  storeIds: z.array(z.string().uuid()),
})

export type UpdateMemberStoresBody = z.infer<typeof updateMemberStoresBodySchema>
