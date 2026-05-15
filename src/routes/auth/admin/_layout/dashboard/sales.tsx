import { createFileRoute } from "@tanstack/react-router";
import SalesDash from "@/routes/auth/-components/-submodules/sales";

export const Route = createFileRoute("/auth/admin/_layout/dashboard/sales")({
  component: RouteComponent,
});

function RouteComponent() {
  return <SalesDash />;
}
