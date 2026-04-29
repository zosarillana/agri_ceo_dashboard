import { createFileRoute } from '@tanstack/react-router'
import WorkforceDash from "@/routes/auth/admin/dashboard/-components/-submodules/workforce";

export const Route = createFileRoute('/auth/admin/dashboard/workforce')({
  component: RouteComponent,
})

function RouteComponent() {
  return <WorkforceDash />;
}
