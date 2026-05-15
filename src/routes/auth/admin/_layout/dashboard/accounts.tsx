import { createFileRoute } from "@tanstack/react-router";
import AccountsDash from  "@/routes/auth/-components/-submodules/accounts";

export const Route = createFileRoute("/auth/admin/_layout/dashboard/accounts")({
  component: RouteComponent,
});

function RouteComponent() {
  return <AccountsDash />;
}
