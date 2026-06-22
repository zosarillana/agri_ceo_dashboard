// lib/permissions.ts
export type Role = "user" | "admin" | "superadmin";
export type Tab = "view" | "input" | "products" | "manage";

export type ModuleName =
  | "production"
  | "qc"
  | "procurement"
  | "workforce"
  | "energy"
  | "trading"
  | "maintenance";

const DEFAULT_TAB_ACCESS: Record<Role, Tab[]> = {
  admin: ["view"],
  user: ["view", "input"],
  superadmin: ["view", "input", "products", "manage"],
};

const MODULE_OVERRIDES: Partial<Record<ModuleName, Record<Role, Tab[]>>> = {
  trading: {
    admin: ["view"],
    user: ["view", "input", "manage"],
    superadmin: ["view", "input", "manage"],
  },
};

export function getAllowedTabs(
  role: Role | undefined | null,
  moduleName?: ModuleName,
): Tab[] {
  if (!role) return [];
  const moduleRules = moduleName ? MODULE_OVERRIDES[moduleName] : undefined;
  const rules = moduleRules ?? DEFAULT_TAB_ACCESS;
  return rules[role] ?? [];
}

export function canAccessTab(
  role: Role | undefined | null,
  tab: Tab,
  moduleName?: ModuleName,
): boolean {
  return getAllowedTabs(role, moduleName).includes(tab);
}

// ── Capability-level checks (not tied to a specific tab) ──────────────────────
// Use these when "can do X" isn't the same shape as "can see tab Y" —
// e.g. inline forms embedded inside a view, like maintenance check submission.

export function canSubmitMaintenanceCheck(role: Role | undefined | null): boolean {
  if (!role) return false;
  // Admins can view maintenance status but not log checks; user/superadmin can.
  return role === "user" || role === "superadmin";
}