// src/routes/auth/user/_layout.tsx
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { UserHeader } from './-header';

export const Route = createFileRoute('/auth/user/_layout')({  // ← this is correct, don't change
  component: UserLayout,
});

function UserLayout() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <UserHeader />
        <Outlet />
      </div>
    </div>
  );
}