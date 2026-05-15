import { createFileRoute } from '@tanstack/react-router'
import ProductionDash from "@/routes/auth/-components/-submodules/production";

export const Route = createFileRoute('/auth/admin/_layout/dashboard/production')({
  component: RouteComponent,
})

function RouteComponent() {
  return <ProductionDash />;
}
