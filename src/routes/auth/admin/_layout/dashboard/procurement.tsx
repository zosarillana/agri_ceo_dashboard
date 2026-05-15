import { createFileRoute } from '@tanstack/react-router'
import ProcurementDash from "@/routes/auth/-components/-submodules/procurement";

export const Route = createFileRoute('/auth/admin/_layout/dashboard/procurement')({
  component: RouteComponent,
})

function RouteComponent() {
  return <ProcurementDash />;
}
