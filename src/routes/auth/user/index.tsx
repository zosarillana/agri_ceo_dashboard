import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/user/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/auth/user/"!</div>
}
