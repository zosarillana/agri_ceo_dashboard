import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { Toaster } from "sonner";
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

function RootComponent() {
  const initializeAuth = useAuthStore((s) => s.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <>
      <Toaster
        position="top-center"
        richColors
        toastOptions={{
          style: { width: "450px" },
        }}
        style={{ "--width": "450px" } as React.CSSProperties}
      />

      <Outlet />

      <TanStackRouterDevtools />
    </>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
});
