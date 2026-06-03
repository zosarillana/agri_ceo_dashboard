import WorkforceDash from '@/routes/auth/-components/-submodules/workforce';
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/user/_layout/dashboard/workforce')({
  component: RouteComponent,
  staticData: { title: 'Workforce' },
})

function RouteComponent() {
  return <WorkforceDash />;
}
