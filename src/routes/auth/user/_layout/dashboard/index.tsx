import UserDashboard from '@/routes/auth/-components/userdashboard';
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/user/_layout/dashboard/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <UserDashboard />;
}