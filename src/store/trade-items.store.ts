// src/store/trade-items.store.ts

import { create } from "zustand";
import { TradeItem } from "@/types/trading.types";
import { tradeItemsService } from "@/services/trade-items.service";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TradeItemPayload {
  name: string;
  code: string;
  input?: string | null;
  output?: string | null;
  market?: string | null;
}

interface TradeItemsStore {
  // State
  tradeItems: TradeItem[];
  loading: boolean;
  saving: boolean;
  error: string | null;

  // Actions
  fetchTradeItems: () => Promise<void>;
  createTradeItem: (payload: TradeItemPayload) => Promise<void>;
  updateTradeItem: (id: number, payload: TradeItemPayload) => Promise<void>;
  deleteTradeItem: (id: number) => Promise<void>;
  clearError: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useTradeItemsStore = create<TradeItemsStore>((set, get) => ({
  // ── Initial state ──────────────────────────────────────────────────────────
  tradeItems: [],
  loading: false,
  saving: false,
  error: null,

  // ── Fetch all trade items ──────────────────────────────────────────────────
  fetchTradeItems: async () => {
    if (get().loading) return;

    set({ loading: true, error: null });
    try {
      const response = await tradeItemsService.getAll();
      console.log("📥 Fetched trade items:", response.data);
      set({ tradeItems: response.data, loading: false });
    } catch (err: any) {
      console.error("❌ Error fetching trade items:", err);
      set({
        error: err?.response?.data?.message ?? "Failed to fetch trade items.",
        loading: false,
      });
    }
  },

  // ── Create a trade item ────────────────────────────────────────────────────
  createTradeItem: async (payload: TradeItemPayload) => {
    console.log("📤 Creating trade item with payload:", payload);
    set({ saving: true, error: null });
    try {
      const response = await tradeItemsService.create(payload);
      console.log("✅ Create response:", response);
      await get().fetchTradeItems();
    } catch (err: any) {
      console.error("❌ Create error:", err);
      console.error("Error response data:", err?.response?.data);
      set({
        error: err?.response?.data?.message ?? "Failed to create trade item.",
      });
      throw err;
    } finally {
      set({ saving: false });
    }
  },

  // ── Update a trade item ────────────────────────────────────────────────────
  updateTradeItem: async (id: number, payload: TradeItemPayload) => {
    console.log(`📤 Updating trade item ${id} with payload:`, payload);
    set({ saving: true, error: null });
    try {
      const response = await tradeItemsService.update(id, payload);
      console.log("✅ Update response:", response);
      await get().fetchTradeItems();
    } catch (err: any) {
      console.error("❌ Update error:", err);
      console.error("Error response data:", err?.response?.data);
      set({
        error: err?.response?.data?.message ?? "Failed to update trade item.",
      });
      throw err;
    } finally {
      set({ saving: false });
    }
  },

  // ── Delete a trade item ────────────────────────────────────────────────────
  deleteTradeItem: async (id: number) => {
    set({ saving: true, error: null });
    try {
      await tradeItemsService.delete(id);
      await get().fetchTradeItems();
    } catch (err: any) {
      set({
        error: err?.response?.data?.message ?? "Failed to delete trade item.",
      });
      throw err;
    } finally {
      set({ saving: false });
    }
  },

  // ── Clear error ───────────────────────────────────────────────────────────
  clearError: () => set({ error: null }),
}));