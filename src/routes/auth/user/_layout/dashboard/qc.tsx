import { createFileRoute } from '@tanstack/react-router'
import QCDash from '@/routes/auth/-components/-submodules/qc'
export const Route = createFileRoute('/auth/user/_layout/dashboard/qc')({
  component: RouteComponent,
})

function RouteComponent() {
  return <QCDash />;
}
