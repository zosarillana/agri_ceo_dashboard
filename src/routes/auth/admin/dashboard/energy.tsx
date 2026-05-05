import { createFileRoute } from '@tanstack/react-router'
import EnergyDash from  "@/routes/auth/admin/dashboard/-components/-submodules/energy";

export const Route = createFileRoute('/auth/admin/dashboard/energy')({
  component: RouteComponent,
})

function RouteComponent() {
  return <EnergyDash />;
}

