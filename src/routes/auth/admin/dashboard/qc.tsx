import { createFileRoute } from '@tanstack/react-router'
import QCDash from "@/routes/auth/admin/dashboard/-components/-submodules/qc";

export const Route = createFileRoute('/auth/admin/dashboard/qc')({
  component: RouteComponent,
})

function RouteComponent() {
  return <QCDash />;
}
