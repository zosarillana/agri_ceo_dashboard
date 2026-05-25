import ProcurementDash from "@/routes/auth/-components/-submodules/procurement";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/auth/user/_layout/dashboard/procurement",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return <ProcurementDash />;
}
