import SalesDash from '@/routes/auth/-components/-submodules/sales';
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/user/_layout/dashboard/sales')({
  component: RouteComponent,
})

function RouteComponent() {
  return <SalesDash />;
}
