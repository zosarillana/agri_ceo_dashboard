import TradingDash from '@/routes/auth/-components/-submodules/qc';
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/user/_layout/dashboard/trading')({
  component: RouteComponent,
})

function RouteComponent() {
  return <TradingDash />;
}
