import { createFileRoute } from "@tanstack/react-router";
import SalesDash from "@/routes/auth/-components/-submodules/sales";
import { salesService } from "@/services/sales.service";

function getCurrentMonthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

export const Route = createFileRoute("/auth/admin/_layout/dashboard/sales")({
  loader: async () => {
    const { from, to } = getCurrentMonthRange();
    const [salesRes, summaryRes] = await Promise.all([
      salesService.getLatest(from, to),
      salesService.getSummary(from, to),
    ]);
    return {
      sales: salesRes.data,
      summary: summaryRes.data,
      dateRange: { from, to },
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return <SalesDash initialData={data} />;
}