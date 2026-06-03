import { create } from "zustand";
import { procurementService } from "@/services/procurement.service";
import {
  ProcurementRecord,
  ProcurementSummary,
  CreateProcurementDTO,
} from "@/types/procurement.types";

interface DateRange {
  from: string | null;
  to: string | null;
}

interface ProcurementState {
  records: ProcurementRecord[];
  summary: ProcurementSummary;
  loading: boolean;
  saving: boolean;
  error: string | null;
  dateRange: DateRange;

  fetchLatest: (from?: string, to?: string) => Promise<void>;
  setDateRange: (range: DateRange) => void;
  clearDateRange: () => void;
  saveRecords: (rows: CreateProcurementDTO[], date?: string) => Promise<void>;
}

const defaultSummary: ProcurementSummary = {
  total_items: 0,
  received: 0,
  delayed: 0,
  pending: 0,
};

export const useProcurementStore = create<ProcurementState>((set, get) => ({
  records: [],
  summary: defaultSummary,
  loading: false,
  saving: false,
  error: null,
  dateRange: { from: null, to: null },

  fetchLatest: async (from?: string, to?: string) => {
    if (get().loading) return;

    const targetFrom = from ?? null;
    const targetTo = to ?? null;

    set({ loading: true, error: null });

    try {
      const [recordsRes, summaryRes] = await Promise.all([
        procurementService.getAll(from, to),
        procurementService.getSummary(from, to),
      ]);

      const recs = Array.isArray(recordsRes.data)
        ? recordsRes.data
        : ((recordsRes.data as any)?.data ?? []);

      const sum = (summaryRes.data as any)?.data ?? summaryRes.data;

      set({
        records: recs,
        summary: sum,
        dateRange: { from: targetFrom, to: targetTo },
      });
    } catch (err: any) {
      set({
        error:
          err?.response?.data?.message ??
          "Failed to fetch procurement records.",
      });
    } finally {
      set({ loading: false });
    }
  },

  setDateRange: (range) => {
    set({ dateRange: range });
    get().fetchLatest(range.from ?? undefined, range.to ?? undefined);
  },

  clearDateRange: () => {
    set({ dateRange: { from: null, to: null } });
    get().fetchLatest();
  },

  saveRecords: async (rows, date) => {
    set({ saving: true, error: null });
    try {
      await procurementService.storeBulk(rows, date);

      const { from, to } = get().dateRange;
      await get().fetchLatest(from ?? undefined, to ?? undefined);
    } catch (err: any) {
      set({
        error:
          err?.response?.data?.message ?? "Failed to save procurement records.",
      });
      throw err;
    } finally {
      set({ saving: false });
    }
  },
}));
