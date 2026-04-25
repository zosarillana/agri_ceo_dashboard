import { createFileRoute, Outlet } from '@tanstack/react-router'
import { GlobalNavbar } from '@/components/global/nav-bar'

export const Route = createFileRoute('/auth/admin/dashboard')({
  component: DashboardLayout,
})

function DashboardLayout() {
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