import { LandingDashboard } from '@/components/landing/landing-dashboard'
import { LandingFooter } from '@/components/landing/landing-footer'
import { LandingNavbar } from '@/components/landing/landing-navbar'
import { requireGuest } from '@/lib/auth.guard'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: requireGuest,
  component: LandingPage,
})

function LandingPage() {
  return (
    <section className="min-h-screen flex flex-col px-8 pt-6 pb-6 gap-6">
      <LandingNavbar />
      <main className="flex-1">
        <LandingDashboard />
      </main>
      <LandingFooter />
    </section>
  )
}