import { createFileRoute } from '@tanstack/react-router'
import MaintenanceDash from "@/routes/auth/admin/_layout/dashboard/-components/-submodules/maintenance";

export const Route = createFileRoute('/auth/admin/_layout/dashboard/maintenance')({
  component: RouteComponent,
})

function RouteComponent() {
  return <MaintenanceDash />;
}
