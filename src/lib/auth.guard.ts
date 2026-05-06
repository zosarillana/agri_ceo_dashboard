import { redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/store/auth.store'

export const requireAuth = async () => {
  const { isAuthenticated, fetchUser } = useAuthStore.getState()

  if (!isAuthenticated) {
    try {
      await fetchUser()
    } catch {
      throw redirect({ to: '/' })
    }

    const { isAuthenticated: isNowAuthenticated } = useAuthStore.getState()
    if (!isNowAuthenticated) {
      throw redirect({ to: '/' })
    }
  }
}

export const requireAdmin = async () => {
  await requireAuth() // first check if logged in

  const { user } = useAuthStore.getState()

  if (!user || !['admin', 'superadmin'].includes(user.role)) {
    throw redirect({ to: '/' }) // or '/unauthorized' if you have that page
  }
}