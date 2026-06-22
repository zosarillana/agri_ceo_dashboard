// hooks/use-can-submit-maintenance-check.ts
import { useRole } from "@/hooks/use-role";
import { canSubmitMaintenanceCheck } from "@/lib/permissions";

export function useCanSubmitMaintenanceCheck(): boolean {
  const role = useRole();
  return canSubmitMaintenanceCheck(role);
}