import { createFileRoute } from '@tanstack/react-router'
import QCDash from '@/routes/auth/-components/-submodules/qc'
export const Route = createFileRoute('/auth/user/_layout/dashboard/qc')({
  component: RouteComponent,
  staticData: { title: 'Quality Control' },
})

function RouteComponent() {
  return <QCDash />;
}
