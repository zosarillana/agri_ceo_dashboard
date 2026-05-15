// src/stores/production.store.ts
import { create } from "zustand";
import {
  productionService,
} from "@/services/production.service";
import { ProductionEntry, ProductionEntryPayload } from "@/types/production.types";

type ProductionStore = {
  entries: ProductionEntry[];
  loading: boolean;
  saving: boolean;
  error: string | null;

  fetchEntries: () => Promise<void>;
  fetchByDate: (date: string) => Promise<void>;
  saveEntries: (entries: ProductionEntryPayload[]) => Promise<void>;
  deleteEntry: (id: number) => Promise<void>;
};

export const useProductionStore = create<ProductionStore>((set, get) => ({
  entries: [],
  loading: false,
  saving: false,
  error: null,

  fetchEntries: async () => {
    set({ loading: true, error: null });
    try {
      const data = await productionService.getAll();
      set({ entries: data });
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Failed to fetch entries." });
    } finally {
      set({ loading: false });
    }
  },

  fetchByDate: async (date: string) => {
    set({ loading: true, error: null });
    try {
      const data = await productionService.getByDate(date);
      set({ entries: data });
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Failed to fetch entries." });
    } finally {
      set({ loading: false });
    }
  },

  saveEntries: async (entries: ProductionEntryPayload[]) => {
    set({ saving: true, error: null });
    try {
      const saved = await productionService.bulkCreate(entries);
      // Merge new entries into the store without replacing existing ones
      set((state) => ({
        entries: [
          ...state.entries.filter(
            (e) => !saved.some((s) => s.product_id === e.product_id && s.production_date === e.production_date)
          ),
          ...saved,
        ],
      }));
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Failed to save entries." });
      throw err; // re-throw so the form can catch it
    } finally {
      set({ saving: false });
    }
  },

  deleteEntry: async (id: number) => {
    try {
      await productionService.delete(id);
      set((state) => ({ entries: state.entries.filter((e) => e.id !== id) }));
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Failed to delete entry." });
    }
  },
}));