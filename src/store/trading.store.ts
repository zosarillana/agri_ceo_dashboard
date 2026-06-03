// src/store/trading.store.ts

import { create } from "zustand";
import { tradingService } from "@/services/trading.service";
import { Trade, TradePayload, TradeSummary } from "@/types/trading.types";

interface DateRange {
  from: string | null;
  to: string | null;
}

interface TradingStore {
  // State
  trades: Trade[];
  summary: TradeSummary;
  dateRange: DateRange;
  loading: boolean;
  saving: boolean;
  error: string | null;

  // Actions
  fetchLatest: (from?: string, to?: string) => Promise<void>;
  setDateRange: (range: DateRange) => void;
  clearDateRange: () => void;
  saveTrades: (payload: TradePayload[], tradeDate?: string) => Promise<void>;
  deleteTrade: (id: number) => Promise<void>;
  updateTrade: (id: number, payload: TradePayload) => Promise<void>;
  clearError: () => void;
}

const defaultSummary: TradeSummary = {
  total_volume: 0,
  total_value: 0,
  avg_price: 0,
  total_orders: 0,
  export_orders: 0,
  local_orders: 0,
  from: null,
  to: null,
};

export const useTradingStore = create<TradingStore>((set, get) => ({
  // Initial state
  trades: [],
  summary: defaultSummary,
  dateRange: { from: null, to: null },
  loading: false,
  saving: false,
  error: null,

  // Fetch trades with optional date range
  fetchLatest: async (from?: string, to?: string) => {
    if (get().loading) return; // only guard against concurrent requests

    set({ loading: true, error: null });
    try {
      const response = await tradingService.getLatest(from, to);
      const trades = response.data;

      // Calculate summary client-side
      const totalVolume = trades.reduce((sum, t) => sum + t.quantity_kg, 0);
      const totalValue = trades.reduce((sum, t) => sum + t.total_value, 0);
      const exportOrders = trades.filter((t) => t.market === "Export").length;
      const localOrders = trades.filter((t) => t.market === "Local").length;

      const summary: TradeSummary = {
        total_volume: totalVolume,
        total_value: totalValue,
        avg_price: totalVolume > 0 ? totalValue / totalVolume : 0,
        total_orders: trades.length,
        export_orders: exportOrders,
        local_orders: localOrders,
        from: from ?? null,
        to: to ?? null,
      };

      set({
        trades,
        summary,
        dateRange: { from: from ?? null, to: to ?? null },
        loading: false,
      });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message ?? "Failed to fetch trades.",
        loading: false,
      });
    }
  },

  // Set date range and refetch
  setDateRange: (range: DateRange) => {
    set({ dateRange: range });
    get().fetchLatest(range.from ?? undefined, range.to ?? undefined);
  },

  // Clear date range and fetch all
  clearDateRange: () => {
    set({ dateRange: { from: null, to: null } });
    get().fetchLatest();
  },

  // Save bulk trades
  saveTrades: async (payload: TradePayload[], tradeDate?: string) => {
    set({ saving: true, error: null });
    try {
      await tradingService.storeBulk(payload, tradeDate);
      // Refetch with current date range after save
      const { from, to } = get().dateRange;
      await get().fetchLatest(from ?? undefined, to ?? undefined);
    } catch (err: any) {
      set({
        error: err?.response?.data?.message ?? "Failed to save trades.",
        saving: false,
      });
      throw err;
    } finally {
      set({ saving: false });
    }
  },

  // Delete a single trade
  deleteTrade: async (id: number) => {
    set({ saving: true, error: null });
    try {
      await tradingService.deleteTrade(id);
      // Refetch with current date range after delete
      const { from, to } = get().dateRange;
      await get().fetchLatest(from ?? undefined, to ?? undefined);
    } catch (err: any) {
      set({
        error: err?.response?.data?.message ?? "Failed to delete trade.",
        saving: false,
      });
      throw err;
    } finally {
      set({ saving: false });
    }
  },

  // Update a single trade
  updateTrade: async (id: number, payload: TradePayload) => {
    set({ saving: true, error: null });
    try {
      await tradingService.updateTrade(id, payload);
      // Refetch with current date range after update
      const { from, to } = get().dateRange;
      await get().fetchLatest(from ?? undefined, to ?? undefined);
    } catch (err: any) {
      set({
        error: err?.response?.data?.message ?? "Failed to update trade.",
        saving: false,
      });
      throw err;
    } finally {
      set({ saving: false });
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
