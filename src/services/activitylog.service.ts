import api from "@/lib/api";

export interface ActivityLog {
  id: number;
  log_name: string;
  description: string;
  subject_type: string;
  subject_id: number;
  causer_id: number | null;
  properties: any;
  created_at: string;

  causer?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface ActivityLogQuery {
  log_name?: string;
  user_id?: number;
  subject_type?: string;
  subject_id?: number;
  search?: string;
  from?: string;
  to?: string;
  per_page?: number;
}

export const activityLogService = {
  getAll: (params?: ActivityLogQuery) =>
    api.get<{
      data: ActivityLog[];
      meta: any;
    }>("/api/activity-logs", {
      params,
    }),
};