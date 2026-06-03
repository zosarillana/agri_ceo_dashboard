import ProductionDash from '@/routes/auth/-components/-submodules/production';
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/user/_layout/dashboard/production')({
  component: RouteComponent,
  staticData: { title: 'Production' },
})

function RouteComponent() {
  return <ProductionDash />;
}