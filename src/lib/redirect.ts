export function getDashboardRoute(role: string) {
  if (role === "admin" || role === "superadmin") {
    return "/auth/admin/dashboard";
  }

  return "/dashboard";
}