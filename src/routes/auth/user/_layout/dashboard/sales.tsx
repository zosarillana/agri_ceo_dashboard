import SalesDash from '@/routes/auth/-components/-submodules/sales';
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/user/_layout/dashboard/sales')({
  component: RouteComponent,
  staticData: { title: 'Sales' },
})

function RouteComponent() {
  return <SalesDash />;
}
