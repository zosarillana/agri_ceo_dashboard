// src/store/qc.store.ts

import { create } from "zustand";
import { qcService } from "@/services/qc.service";
import { QcRecord, QcPayload, QcSummary } from "@/types/qc.types";

interface DateRange {
  from: string | null;
  to: string | null;
}

type QcStore = {
  records: QcRecord[];
  summary: QcSummary;
  dateRange: DateRange;
  loading: boolean;
  saving: boolean;
  error: string | null;

  fetchLatest: (from?: string, to?: string) => Promise<void>;
  setDateRange: (range: DateRange) => void;
  clearDateRange: () => void;
  saveRecords: (rows: QcPayload[], qcDate?: string) => Promise<void>;
};

const defaultSummary: QcSummary = {
  samples_tested: 0,
  samples_passed: 0,
  samples_failed: 0,
  pass_rate: 0,
  rejection_rate: 0,
  products_tested: 0,
  from: null,
  to: null,
};

export const useQcStore = create<QcStore>((set, get) => ({
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
      get().records.length > 0 && 
      get().dateRange.from === targetFrom && 
      get().dateRange.to === targetTo
    )) return;

    set({ loading: true, error: null });
    try {
      const response = await qcService.getLatest(from, to);

      // Compute summary client-side from records (same pattern as Sales)
      const records = response.data;
      const totalTested = records.reduce((s, r) => s + r.tested, 0);
      const totalPassed = records.reduce((s, r) => s + r.passed, 0);
      const totalFailed = totalTested - totalPassed;

      const summary: QcSummary = {
        samples_tested: totalTested,
        samples_passed: totalPassed,
        samples_failed: totalFailed,
        pass_rate:
          totalTested > 0
            ? parseFloat(((totalPassed / totalTested) * 100).toFixed(4))
            : 0,
        rejection_rate:
          totalTested > 0
            ? parseFloat(((totalFailed / totalTested) * 100).toFixed(4))
            : 0,
        products_tested: records.length,
        from: from ?? null,
        to: to ?? null,
      };

      set({
        records,
        summary,
        dateRange: { from: from ?? null, to: to ?? null },
      });
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Failed to fetch QC records." });
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

  saveRecords: async (rows: QcPayload[], qcDate?: string) => {
    set({ saving: true, error: null });
    try {
      await qcService.storeBulk(rows, qcDate);
      const { from, to } = get().dateRange;
      await get().fetchLatest(from ?? undefined, to ?? undefined);
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Failed to save QC records." });
      throw err;
    } finally {
      set({ saving: false });
    }
  },
}));