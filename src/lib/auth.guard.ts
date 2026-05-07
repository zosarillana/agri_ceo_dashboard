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
      return "/auth/admin/dashboard";
    default:
      return "/";
  }
};

const requireAuth = async () => {
  console.log("🔐 requireAuth called");

  await waitForAuthInit();

  const state = useAuthStore.getState();

  console.log("📦 auth state:", state);

  if (!state.isAuthenticated) {
    console.log("❌ redirecting unauthenticated user");

    throw redirect({ to: "/" });
  }

  console.log("✅ auth passed");
};

export const requireAdmin = async () => {
  await requireAuth();

  const { user } = useAuthStore.getState();

  if (!user || !["admin", "superadmin"].includes(user.role)) {
    throw redirect({ to: "/" });
  }
};

export const requireGuest = async () => {
  console.log("🟡 requireGuest called");

  await waitForAuthInit();

  const { isAuthenticated, user } = useAuthStore.getState();

  console.log("📦 requireGuest state:", {
    isAuthenticated,
    user,
  });

  if (isAuthenticated && user) {
    console.log("➡️ redirecting authenticated user");

    throw redirect({
      to: getDashboardRouteByRole(user.role),
    });
  }

  console.log("✅ guest allowed");
};