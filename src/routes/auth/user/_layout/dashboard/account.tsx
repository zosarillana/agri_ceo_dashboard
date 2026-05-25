import AccountsDash from '@/routes/auth/-components/-submodules/accounts';
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/user/_layout/dashboard/account')({
  component: RouteComponent,
})

function RouteComponent() {
  return <AccountsDash />;
}
