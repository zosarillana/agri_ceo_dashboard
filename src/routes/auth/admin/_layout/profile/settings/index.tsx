import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/admin/_layout/profile/settings/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/auth/admin/profile/settings/"!</div>
}
