import { Profile } from '@/routes/auth/-components/-profile/profile'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/user/_layout/profile/')({
  component: Profile,
})
