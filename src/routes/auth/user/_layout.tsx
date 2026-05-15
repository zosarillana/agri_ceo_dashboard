import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/user/_layout')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/auth/user/_layout"!</div>
}
