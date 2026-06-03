import AccountsDash from '@/routes/auth/-components/-submodules/accounts';
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/user/_layout/dashboard/accounts')({
  component: RouteComponent,
  staticData: { title: 'Accounts' },
})

function RouteComponent() {
  return <AccountsDash />;
}
