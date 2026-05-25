import { Users } from '@/routes/auth/-components/-profile/users'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/admin/_layout/profile/users/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Users />
}