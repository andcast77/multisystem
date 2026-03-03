import { userDisplayName } from '../core/auth.js'
import type { UserResponse } from '../dto/users.dto.js'

type UserEntity = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export function toUserResponse(user: UserEntity): UserResponse {
  return {
    ...user,
    name: userDisplayName(user),
  }
}

export function toUserListResponse(users: UserEntity[]): UserResponse[] {
  return users.map(toUserResponse)
}
