import { createFileRoute } from "@tanstack/react-router";
import SalesDash from "@/routes/auth/admin/dashboard/-components/-submodules/sales";

export const Route = createFileRoute("/auth/admin/dashboard/sales")({
  component: RouteComponent,
});

function RouteComponent() {
  return <SalesDash />;
}
