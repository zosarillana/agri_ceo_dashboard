import { createFileRoute } from '@tanstack/react-router'
import WorkforceDash from "@/routes/auth/-components/-submodules/workforce";

export const Route = createFileRoute('/auth/admin/_layout/dashboard/workforce')({
  component: RouteComponent,
})

function RouteComponent() {
  return <WorkforceDash />;
}
