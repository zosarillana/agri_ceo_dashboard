import { createFileRoute } from '@tanstack/react-router'
import TradingDash from "@/routes/auth/admin/dashboard/-components/-submodules/trading";

export const Route = createFileRoute('/auth/admin/dashboard/trading')({
  component: RouteComponent,
})

function RouteComponent() {
  return <TradingDash />;
}
