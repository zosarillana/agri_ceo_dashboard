import { createFileRoute } from '@tanstack/react-router'
import MaintenanceDash from "@/routes/auth/admin/dashboard/-components/-submodules/maintenance";

export const Route = createFileRoute('/auth/admin/dashboard/maintenance')({
  component: RouteComponent,
})

function RouteComponent() {
  return <MaintenanceDash />;
}
