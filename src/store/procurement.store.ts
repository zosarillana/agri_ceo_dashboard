import { create } from "zustand";
import { procurementService } from "@/services/procurement.service";
import {
  ProcurementRecord,
  ProcurementSummary,
  CreateProcurementDTO,
} from "@/types/procurement.types";

interface ProcurementState {
  records: ProcurementRecord[];
  summary: ProcurementSummary;
  loading: boolean;
  saving: boolean;
  dateRange: { from: string | null; to: string | null };

  fetchLatest: (from?: string, to?: string) => Promise<void>;
  setDateRange: (range: { from: string | null; to: string | null }) => void;
  clearDateRange: () => void;
  saveRecords: (rows: CreateProcurementDTO[], date?: string) => Promise<void>;
}

export const useProcurementStore = create<ProcurementState>((set, get) => ({
  records: [],
  summary: {
    total_items: 0,
    received: 0,
    delayed: 0,
    pending: 0,
  },
  loading: false,
  saving: false,
  dateRange: { from: null, to: null },

  fetchLatest: async (from, to) => {
    const targetFrom = from ?? null;
    const targetTo = to ?? null;

    if (get().loading || (
      // get().records.length > 0 && 
      get().dateRange.from === targetFrom && 
      get().dateRange.to === targetTo
    )) return;

    set({ loading: true });
    try {
      const [recordsRes, summaryRes] = await Promise.all([
        procurementService.getAll(from, to),
        procurementService.getSummary(from, to),
      ]);
      const recs = Array.isArray(recordsRes.data)
        ? recordsRes.data
        : ((recordsRes.data as any)?.data ?? []);
      const sum = (summaryRes.data as any)?.data ?? summaryRes.data;
      set({ records: recs, summary: sum });
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
    set({ saving: true });
    try {
      await procurementService.storeBulk(rows, date);
    } finally {
      set({ saving: false });
    }
  },
}));
