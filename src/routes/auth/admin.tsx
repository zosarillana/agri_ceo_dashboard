import { createFileRoute, Outlet } from '@tanstack/react-router'
import { GlobalNavbar } from '@/components/global/nav-bar'

export const Route = createFileRoute('/auth/admin')({
  component: AdminLayout,
})

function AdminLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <GlobalNavbar
        userName="Admin User"
        userEmail="admin@gmail.com"
        isAuthenticated={true}
      />

      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}