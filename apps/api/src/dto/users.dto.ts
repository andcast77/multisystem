import { z } from 'zod'

/** Response: user with display name */
export type UserResponse = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  name: string
}

/** Input: create user */
export const createUserBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['USER', 'ADMIN', 'SUPERADMIN']).optional(),
  isActive: z.boolean().optional(),
})

export type CreateUserBody = z.infer<typeof createUserBodySchema>

/** Input: update user */
export const updateUserBodySchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(1).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['USER', 'ADMIN', 'SUPERADMIN']).optional(),
  isActive: z.boolean().optional(),
})

export type UpdateUserBody = z.infer<typeof updateUserBodySchema>
