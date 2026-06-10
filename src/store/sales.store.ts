import { create } from "zustand";
import { salesService } from "@/services/sales.service";
import { Sale, SalePayload, SalesSummary } from "@/types/sales.types";

interface DateRange {
  from: string | null;
  to: string | null;
}

type SalesStore = {
  sales: Sale[];
  summary: SalesSummary;
  dateRange: DateRange;
  loading: boolean;
  saving: boolean;
  error: string | null;

  setSalesData: (sales: Sale[], summary: SalesSummary, dateRange: DateRange) => void;
  fetchLatest: (from?: string, to?: string) => Promise<void>;
  fetchSummary: (from?: string, to?: string) => Promise<void>;
  fetchAll: (from?: string, to?: string) => Promise<void>;
  setDateRange: (range: DateRange) => void;
  clearDateRange: () => void;
  saveSales: (rows: SalePayload[], saleDate?: string) => Promise<void>;
};

const defaultSummary: SalesSummary = {
  total_sales_usd: 0,
  total_quantity_kg: 0,
  export_count: 0,
  local_count: 0,
  detailed_summary: [],
  from: null,
  to: null,
};

export const useSalesStore = create<SalesStore>((set, get) => ({
  sales: [],
  summary: defaultSummary,
  dateRange: { from: null, to: null },
  loading: false,
  saving: false,
  error: null,

  // Hydrate from route loader — no network call
  setSalesData: (sales, summary, dateRange) =>
    set({ sales, summary, dateRange }),

  // Raw fetchers — no loading management, fetchAll owns that
  fetchLatest: async (from?: string, to?: string) => {
    try {
      const response = await salesService.getLatest(from, to);
      set({ sales: response.data });
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Failed to fetch sales." });
    }
  },

  fetchSummary: async (from?: string, to?: string) => {
    try {
      const response = await salesService.getSummary(from, to);
      set({ summary: response.data });
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Failed to fetch summary." });
    }
  },

  // Orchestrator — the only one that touches loading
  fetchAll: async (from?: string, to?: string) => {
    set({ loading: true, error: null, dateRange: { from: from ?? null, to: to ?? null } });
    try {
      await Promise.all([
        get().fetchLatest(from, to),
        get().fetchSummary(from, to),
      ]);
    } finally {
      set({ loading: false });
    }
  },

  // Convenience — set range and fetch in one call
  setDateRange: (range: DateRange) => {
    set({ dateRange: range });
    get().fetchAll(range.from ?? undefined, range.to ?? undefined);
  },

  clearDateRange: () => {
    get().fetchAll(); // fetchAll resets dateRange to null/null internally
  },

  saveSales: async (rows: SalePayload[], saleDate?: string) => {
    set({ saving: true, error: null });
    try {
      await salesService.storeBulk(rows, saleDate);
      const { from, to } = get().dateRange;
      await get().fetchAll(from ?? undefined, to ?? undefined);
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Failed to save sales." });
      throw err;
    } finally {
      set({ saving: false });
    }
  },
}));