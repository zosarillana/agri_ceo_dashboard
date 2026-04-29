import { createFileRoute } from '@tanstack/react-router'
import ProductionDash from "@/routes/auth/admin/dashboard/-components/-submodules/production";

export const Route = createFileRoute('/auth/admin/dashboard/production')({
  component: RouteComponent,
})

function RouteComponent() {
  return <ProductionDash />;
}
