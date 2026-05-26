// src/services/workforce.service.ts

import api from "@/lib/api";
import { WorkforceRecord, WorkforceRowPayload, WorkforceSummary } from "@/types/workforce.types";

export const workforceService = {
  getLatest: async (
    from?: string,
    to?: string,
  ): Promise<{ data: WorkforceRecord[]; summary: WorkforceSummary }> => {
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to)   params.append("to", to);
    const response = await api.get(`api/workforce?${params.toString()}`);
    return response.data;
  },

  getSummary: async (
    from?: string,
    to?: string,
  ): Promise<WorkforceSummary> => {
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to)   params.append("to", to);
    const response = await api.get(`api/workforce/summary?${params.toString()}`);
    return response.data;
  },

  storeBulk: async (
    rows: WorkforceRowPayload[],
    recordDate?: string,
  ): Promise<{ message: string; data: WorkforceRecord[]; summary: WorkforceSummary }> => {
    const response = await api.post("api/workforce", {
      rows,
      record_date: recordDate,
    });
    return response.data;
  },

  getDepartmentHistory: async (
    departmentKey: string,
    from?: string,
    to?: string,
  ): Promise<{ department_key: string; data: WorkforceRecord[] }> => {
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to)   params.append("to", to);
    const response = await api.get(`api/workforce/history/${departmentKey}?${params.toString()}`);
    return response.data;
  },
};