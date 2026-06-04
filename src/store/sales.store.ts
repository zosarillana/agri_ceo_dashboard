// src/stores/sales.store.ts

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

  fetchLatest: (from?: string, to?: string) => Promise<void>;
  fetchSummary: (from?: string, to?: string) => Promise<void>;  // ✅ new
  fetchAll: (from?: string, to?: string) => Promise<void>;      // ✅ new — calls both
  setDateRange: (range: DateRange) => void;
  saveSales: (rows: SalePayload[], saleDate?: string) => Promise<void>;
  clearDateRange: () => void;
};

const defaultSummary: SalesSummary = {
  total_sales_usd: 0,
  total_quantity_kg: 0,
  export_count: 0,
  local_count: 0,
  detailed_summary: [],  // ✅ add this to your SalesSummary type too
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

  // ✅ Fetches latest-per-product (for the table rows)
  fetchLatest: async (from?: string, to?: string) => {
    set({ loading: true, error: null });
    try {
      const response = await salesService.getLatest(from, to);
      set({ sales: response.data });
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Failed to fetch sales." });
    } finally {
      set({ loading: false });
    }
  },

  // ✅ Fetches aggregated summary from the backend (real totals)
  fetchSummary: async (from?: string, to?: string) => {
    try {
      const response = await salesService.getSummary(from, to); // add this to your service
      set({ summary: response.data });
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Failed to fetch summary." });
    }
  },

  // ✅ Call this everywhere instead of fetchLatest — runs both in parallel
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

  setDateRange: (range: DateRange) => {
    set({ dateRange: range });
    get().fetchAll(range.from ?? undefined, range.to ?? undefined);
  },

  clearDateRange: () => {
    set({ dateRange: { from: null, to: null } });
    get().fetchAll();
  },

  saveSales: async (rows: SalePayload[], saleDate?: string) => {
    set({ saving: true, error: null });
    try {
      await salesService.storeBulk(rows, saleDate);
      const { from, to } = get().dateRange;
      await get().fetchAll(from ?? undefined, to ?? undefined); // ✅ refresh both
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Failed to save sales." });
      throw err;
    } finally {
      set({ saving: false });
    }
  },
}));