// src/stores/workforce.store.ts

import { create } from "zustand";
import { workforceService } from "@/services/workforce.service";
import {
  WorkforceRecord,
  WorkforceRowPayload,
  WorkforceSummary,
} from "@/types/workforce.types";

interface DateRange {
  from: string | null;
  to: string | null;
}

type WorkforceStore = {
  records: WorkforceRecord[];
  summary: WorkforceSummary;
  dateRange: DateRange;
  loading: boolean;
  saving: boolean;
  error: string | null;

  fetchLatest: (from?: string, to?: string) => Promise<void>;
  setDateRange: (range: DateRange) => void;
  clearDateRange: () => void;
  saveRecords: (rows: WorkforceRowPayload[], recordDate?: string) => Promise<void>;
};

const defaultSummary: WorkforceSummary = {
  total_present: 0,
  total_headcount: 0,
  total_incidents: 0,
  attendance_rate: null,
  department_count: 0,
  by_section: {
    DEPARTMENT:    { present: 0, headcount: 0, incidents: 0, rate: null },
    "DIRECT COST": { present: 0, headcount: 0, incidents: 0, rate: null },
  },
  from: null,
  to: null,
};

export const useWorkforceStore = create<WorkforceStore>((set, get) => ({
  records: [],
  summary: defaultSummary,
  dateRange: { from: null, to: null },
  loading: false,
  saving: false,
  error: null,

  fetchLatest: async (from?: string, to?: string) => {
    const targetFrom = from ?? null;
    const targetTo = to ?? null;

    if (get().loading || (
      // get().records.length > 0 && 
      get().dateRange.from === targetFrom && 
      get().dateRange.to === targetTo
    )) return;

    set({ loading: true, error: null });
    try {
      const response = await workforceService.getLatest(from, to);
      set({
        records: response.data,
        summary: response.summary,
        dateRange: { from: from ?? null, to: to ?? null },
      });
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Failed to fetch workforce records." });
    } finally {
      set({ loading: false });
    }
  },

  setDateRange: (range: DateRange) => {
    set({ dateRange: range });
    get().fetchLatest(range.from ?? undefined, range.to ?? undefined);
  },

  clearDateRange: () => {
    set({ dateRange: { from: null, to: null } });
    get().fetchLatest();
  },

  saveRecords: async (rows: WorkforceRowPayload[], recordDate?: string) => {
    set({ saving: true, error: null });
    try {
      await workforceService.storeBulk(rows, recordDate);
      const { from, to } = get().dateRange;
      await get().fetchLatest(from ?? undefined, to ?? undefined);
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Failed to save workforce records." });
      throw err;
    } finally {
      set({ saving: false });
    }
  },
}));