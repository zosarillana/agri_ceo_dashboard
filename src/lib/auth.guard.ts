import { redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/store/auth.store";

const waitForAuthInit = async () => {
  const store = useAuthStore.getState();

  if (store.initialized) return;

  await store.initializeAuth();
};

export const getDashboardRouteByRole = (role: string) => {
  switch (role) {
    case "superadmin":
    case "admin":
      return "/auth/admin/dashboard" as const;
    case "user":
      return "/auth/user" as const;
    default:
      return "/auth/user" as const;
  }
};

const requireAuth = async () => {
  await waitForAuthInit();

  const state = useAuthStore.getState();

  if (!state.isAuthenticated) {
    throw redirect({ to: "/" });
  }
};

export const requireAdmin = async () => {
  await requireAuth();

  const { user } = useAuthStore.getState();

  if (!user || !["admin", "superadmin"].includes(user.role)) {
    throw redirect({ to: "/" });
  }
};

export const requireGuest = async () => {
  await waitForAuthInit();

  const { isAuthenticated, user } = useAuthStore.getState();

  if (isAuthenticated && user) {
    throw redirect({
      to: getDashboardRouteByRole(user.role),
    });
  }
};

export const requireUser = async () => {
  await requireAuth();

  const { user } = useAuthStore.getState();

  if (!user || user.role !== "user") {
    throw redirect({ to: "/" });
  }
};