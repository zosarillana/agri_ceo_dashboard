import TradingDash from '@/routes/auth/-components/-submodules/trading';
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/user/_layout/dashboard/trading')({
  component: RouteComponent,
  staticData: { title: 'Trading' },
})

function RouteComponent() {
  return <TradingDash />;
}
