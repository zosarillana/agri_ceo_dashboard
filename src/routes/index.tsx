import { LandingFeatures } from '@/components/landing/landing-features'
import { LandingFooter } from '@/components/landing/landing-footer'
import { LandingHero } from '@/components/landing/landing-hero'
import { LandingNavbar } from '@/components/landing/landing-navbar'
import { LandingPreview } from '@/components/landing/landing-preview'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: LandingPage,
})
 
function LandingPage() {
  return (
  <section className="min-h-screen flex flex-col px-8 pt-6 pb-6 gap-6">
      <LandingNavbar />
      <main className="flex-1">
        <LandingHero />
        <div className="h-px bg-border mx-10 my-10" />
        <LandingPreview />
        <div className="h-px bg-border mx-10 my-10" />
        <LandingFeatures />
      </main>
      <LandingFooter />
    </section>
  )
}


// export const Route = createFileRoute('/')({
//   component: RouteComponent,
// })

// function RouteComponent() {
//   return <div>Hello "/"!</div>
// }
// import { createFileRoute, redirect } from "@tanstack/react-router";

// export const Route = createFileRoute("/")({
//   //   component: RouteComponent,|
//   beforeLoad: () => {
//     throw redirect({ to: "/about" });
//   },
// });

// function RouteComponent() {
//   return <div>Hello "/"!</div>;
// }
