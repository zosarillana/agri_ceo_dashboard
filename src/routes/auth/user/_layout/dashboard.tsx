import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/user/_layout/dashboard')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/auth/user/_layout/dashboard/dashboard"!</div>
}
