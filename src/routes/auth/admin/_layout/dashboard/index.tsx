import { createFileRoute } from "@tanstack/react-router";
import CEODashboard from "./-components/ceo-dashboard";

export const Route = createFileRoute("/auth/admin/_layout/dashboard/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <CEODashboard />;
}