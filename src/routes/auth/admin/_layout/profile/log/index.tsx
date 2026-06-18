import { ActivityLogs } from '@/routes/auth/-components/-logs/activitylogs'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/admin/_layout/profile/log/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <ActivityLogs />
}
