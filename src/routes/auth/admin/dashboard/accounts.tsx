import { createFileRoute } from "@tanstack/react-router";
import AccountsDash from  "@/routes/auth/admin/dashboard/-components/-submodules/accounts";

export const Route = createFileRoute("/auth/admin/dashboard/accounts")({
  component: RouteComponent,
});

function RouteComponent() {
  return <AccountsDash />;
}
