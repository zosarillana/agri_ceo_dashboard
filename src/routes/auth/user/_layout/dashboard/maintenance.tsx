import MaintenanceDash from '@/routes/auth/-components/-submodules/maintenance';
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/auth/user/_layout/dashboard/maintenance',
)({
  component: RouteComponent,
  staticData: { title: 'Maintenance' },
})

function RouteComponent() {
  return <MaintenanceDash />;
}
