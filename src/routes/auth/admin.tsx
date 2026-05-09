import { createFileRoute, Outlet } from "@tanstack/react-router";
import { GlobalNavbar } from "@/components/global/nav-bar";
import { requireAdmin } from "@/lib/auth.guard";

export const Route = createFileRoute("/auth/admin")({
  beforeLoad: requireAdmin,
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <GlobalNavbar />

      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
