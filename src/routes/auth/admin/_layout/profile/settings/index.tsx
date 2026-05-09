import { createFileRoute } from '@tanstack/react-router'
import { Settings } from '../-components/settings'

export const Route = createFileRoute('/auth/admin/_layout/profile/settings/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Settings />
}