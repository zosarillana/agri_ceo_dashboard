import { createFileRoute } from '@tanstack/react-router'
import { Settings } from '../../../../-components/-profile/settings'

export const Route = createFileRoute('/auth/user/_layout/profile/settings/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Settings />
}