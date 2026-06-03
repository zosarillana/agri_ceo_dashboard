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
  setDateRange: (range: DateRange) => void;
  saveSales: (rows: SalePayload[], saleDate?: string) => Promise<void>;
  clearDateRange: () => void;
};

const defaultSummary: SalesSummary = {
  total_sales_usd: 0,
  total_quantity_kg: 0,
  export_count: 0,
  local_count: 0,
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

  fetchLatest: async (from?: string, to?: string) => {
    const targetFrom = from ?? null;
    const targetTo = to ?? null;

    if (get().loading || (
      // get().sales.length > 0 && 
      get().dateRange.from === targetFrom && 
      get().dateRange.to === targetTo
    )) return;

    set({ loading: true, error: null });
    try {
      const response = await salesService.getLatest(from, to);
      
      const summary: SalesSummary = {
        total_sales_usd: response.data.reduce((sum, sale) => sum + Number(sale.total_sales_usd), 0),
        total_quantity_kg: response.data.reduce((sum, sale) => sum + Number(sale.quantity_kg), 0),
        export_count: response.data.filter(sale => sale.market === 'Export').length,
        local_count: response.data.filter(sale => sale.market === 'Local').length,
        from: from ?? null,
        to: to ?? null,
      };
      
      set({ 
        sales: response.data, 
        summary,
        dateRange: { from: from ?? null, to: to ?? null }
      });
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Failed to fetch sales." });
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

  saveSales: async (rows: SalePayload[], saleDate?: string) => {
    set({ saving: true, error: null });
    try {
      await salesService.storeBulk(rows, saleDate);
      const { from, to } = get().dateRange;
      await get().fetchLatest(from ?? undefined, to ?? undefined);
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Failed to save sales." });
      throw err;
    } finally {
      set({ saving: false });
    }
  },
}));