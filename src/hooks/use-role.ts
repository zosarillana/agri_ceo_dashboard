// hooks/use-role.ts
import { Role } from "@/lib/permissions";
import { useAuthStore } from "@/store/auth.store"; // wherever your logged-in user lives

export function useRole(): Role | undefined {
  return useAuthStore((s) => s.user?.role);
}