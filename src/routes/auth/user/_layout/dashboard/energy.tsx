import EnergyDash from '@/routes/auth/-components/-submodules/energy';
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/user/_layout/dashboard/energy')({
  component: RouteComponent,
  staticData: { title: 'Energy' },
})

function RouteComponent() {
  return <EnergyDash />;
}
