// __root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Toaster } from 'sonner'

export const Route = createRootRoute({
  component: () => (
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
  ),
})