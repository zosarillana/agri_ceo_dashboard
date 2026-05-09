import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminHeader } from "./-header";

export const Route = createFileRoute("/auth/admin/_layout")({
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6">

        {/* 🔥 THIS IS THE GLOBAL HEADER */}
        <AdminHeader />

        <Outlet />
      </div>
    </div>
  );
}