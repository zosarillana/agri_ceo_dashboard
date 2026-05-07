import { createFileRoute } from '@tanstack/react-router'
import { Profile } from "@/routes/auth/admin/_layout/profile/-components/profile";

export const Route = createFileRoute('/auth/admin/_layout/profile/')({
  component: Profile,
})


// function RouteComponent() {
//   return <div>Hello "/auth/admin/profile/"!</div>
// }
