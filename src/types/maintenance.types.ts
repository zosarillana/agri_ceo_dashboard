// src/types/maintenance.types.ts

// ─── Enums ────────────────────────────────────────────────────────────────────

export type MaintenanceStatus = "operational" | "maintenance" | "down" | "standby";

// ─── Plants ───────────────────────────────────────────────────────────────────

export type Plant = {
  id: number;
  name: string;
  code: string | null;
  units: MaintenanceUnit[];
};

// ─── Units ────────────────────────────────────────────────────────────────────

export type SubUnit = {
  id: number;
  name: string;
  status: MaintenanceStatus;
};

export type MaintenanceUnit = {
  id: number;
  name: string;
  status: MaintenanceStatus;
  notes: string | null;
  last_checked_at: string | null;   // ISO string
  next_scheduled_at: string | null; // ISO string
  subunits?: SubUnit[];
};

export type CreateUnitPayload = {
  plant_id: number;
  parent_id?: number | null;
  name: string;
  status?: MaintenanceStatus;
  notes?: string | null;
  last_checked_at?: string | null;
  next_scheduled_at?: string | null;
};

export type UpdateUnitPayload = Partial<{
  status: MaintenanceStatus;
  notes: string | null;
  last_checked_at: string | null;
  next_scheduled_at: string | null;
}>;

// ─── Logs ─────────────────────────────────────────────────────────────────────

export type MaintenanceLog = {
  id: number;
  unit_id: number;
  unit_name: string;
  status: MaintenanceStatus;
  notes: string | null;
  checked_at: string;               // ISO string
  next_scheduled_at: string | null; // ISO string
  duration_minutes: number | null;
  checked_by: {
    id: number;
    name: string;
  };
};

export type SubmitCheckPayload = {
  status: MaintenanceStatus;
  notes?: string | null;
  checked_at?: string | null;
  next_scheduled_at?: string | null;
  duration_minutes?: number | null;
};

// ─── Summary ──────────────────────────────────────────────────────────────────

export type PlantStatusSummary = {
  plant_id: number;
  plant_name: string;
  total: number;
  operational: number;
  maintenance: number;
  down: number;
  standby: number;
};

export type DailyCompletionSummary = {
  plant: string;
  total: number;
  checked: number;
  unchecked: number;
  completion: number; // 0–100
};

export type TodaysChecks = {
  plant: string;
  checks: MaintenanceLog[];
};

export type UncheckedUnit = {
  id: number;
  name: string;
  plant: string;
  last_checked_at: string | null;
};

// ─── Paginated response wrapper (Laravel paginator) ───────────────────────────

export type Paginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type MaintenanceLogByPlant = {
  plant: string;
  checks: MaintenanceLog[];
};