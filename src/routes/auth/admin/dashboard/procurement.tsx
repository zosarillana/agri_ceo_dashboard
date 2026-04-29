import { createFileRoute } from '@tanstack/react-router'
import ProcurementDash from "@/routes/auth/admin/dashboard/-components/-submodules/procurement";

export const Route = createFileRoute('/auth/admin/dashboard/procurement')({
  component: RouteComponent,
})

function RouteComponent() {
  return <ProcurementDash />;
}
