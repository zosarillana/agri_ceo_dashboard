import { createFileRoute } from "@tanstack/react-router";
import CEODashboard from "../../../-components/ceodashboard";
import { dashboardService } from "@/services/dashboard.service";

export const Route = createFileRoute("/auth/admin/_layout/dashboard/")({
  loader: async () => {
    return await dashboardService.getStats();
  },
  component: RouteComponent,
});

function RouteComponent() {
  const stats = Route.useLoaderData();
  return <CEODashboard initialStats={stats} />;
}