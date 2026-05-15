import { createFileRoute } from '@tanstack/react-router'
import TradingDash from "@/routes/auth/-components/-submodules/trading";

export const Route = createFileRoute('/auth/admin/_layout/dashboard/trading')({
  component: RouteComponent,
})

function RouteComponent() {
  return <TradingDash />;
}
