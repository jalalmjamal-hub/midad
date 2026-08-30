import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export type UserRole = 'manager' | 'employee' | 'customer'

export async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user ? { ...session.user, role: ((session.user as { role?: string }).role ?? 'customer') as UserRole } : null
}

export async function requireRole(roles: UserRole[], redirectTo = '/sign-in') {
  const currentUser = await getCurrentUser()
  if (!currentUser || !roles.includes(currentUser.role)) redirect(redirectTo)
  return currentUser
}

export function canManageUsers(role: UserRole) {
  return role === 'manager'
}

export function canOperate(role: UserRole) {
  return role === 'manager' || role === 'employee'
}
