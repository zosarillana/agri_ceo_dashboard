import { createFileRoute } from '@tanstack/react-router'
import EnergyDash from  "@/routes/auth/admin/_layout/dashboard/-components/-submodules/energy";

export const Route = createFileRoute('/auth/admin/_layout/dashboard/energy')({
  component: RouteComponent,
})

function RouteComponent() {
  return <EnergyDash />;
}

