// src/types/workforce.types.ts

export type WorkforceSection = 'DEPARTMENT' | 'DIRECT COST';

export interface WorkforceRecord {
  id: number;
  department_key: string;
  department_label: string;
  section: WorkforceSection;
  present: number;
  headcount: number;
  incidents: number;
  attendance_rate: number | null;
  record_date: string;
  created_at: string;
  updated_at: string;
}

export interface WorkforceRowPayload {
  department_key: string;
  present: number;
  headcount: number;
  incidents: number;
}

export interface WorkforceSummary {
  total_present: number;
  total_headcount: number;
  total_incidents: number;
  attendance_rate: number | null;
  department_count: number;
  by_section: Record<WorkforceSection, {
    present: number;
    headcount: number;
    incidents: number;
    rate: number | null;
  }>;
  from: string | null;
  to: string | null;
}