import { userDisplayName } from '../core/auth.js'
import type { UserResponse } from '../dto/users.dto.js'

type UserEntity = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export function toUserResponse(user: UserEntity): UserResponse {
  return {
    ...user,
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    name: userDisplayName({
      email: user.email,
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
    }),
  }
}

export function toUserListResponse(users: UserEntity[]): UserResponse[] {
  return users.map(toUserResponse)
}
