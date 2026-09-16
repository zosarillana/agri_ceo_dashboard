import { create } from "zustand";
import { productionService } from "@/services/production.service";
import {
  ProductionEntry,
  ProductionEntryPayload,
} from "@/types/production.types";

type ProductionStore = {
  entries: ProductionEntry[];
  loading: boolean;
  saving: boolean;
  error: string | null;

  // 👇 NEW — isolated from `entries` on purpose. `entries` is scoped to
  // whatever date/range/month the person currently has selected in the
  // UI (and can be a single day, in which case it's useless for a
  // month-to-date total). mtdEntries is always "day 1 of the month
  // through a given as-of date", fetched independently, so mtd_total
  // stays correct no matter what the main view is currently showing.
  mtdEntries: ProductionEntry[];
  mtdLoading: boolean;

  fetchEntries: () => Promise<void>;
  fetchByDate: (date: string) => Promise<void>;
  fetchByRange: (from: string, to: string) => Promise<void>;
  fetchByMonth: (month: string) => Promise<void>;
  fetchMtd: (asOfDate: string) => Promise<void>; // 👈 new
  saveEntries: (entries: ProductionEntryPayload[]) => Promise<void>;
  deleteEntry: (id: number) => Promise<void>;
};

function monthStartISO(dateISO: string): string {
  return `${dateISO.slice(0, 7)}-01`;
}

export const useProductionStore = create<ProductionStore>((set, get) => ({
  entries: [],
  loading: false,
  saving: false,
  error: null,

  mtdEntries: [],
  mtdLoading: false,

  fetchEntries: async () => {
    set({ loading: true, error: null });
    try {
      const data = await productionService.getAll();
      set({ entries: data });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message ?? "Failed to fetch entries.",
      });
    } finally {
      set({ loading: false });
    }
  },

  fetchByDate: async (date: string) => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const data = await productionService.getByDate(date);
      set({ entries: data });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message ?? "Failed to fetch entries.",
      });
    } finally {
      set({ loading: false });
    }
  },

  fetchByRange: async (from: string, to: string) => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const data = await productionService.getByRange(from, to);
      set({ entries: data });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message ?? "Failed to fetch entries.",
      });
    } finally {
      set({ loading: false });
    }
  },

  fetchByMonth: async (month: string) => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const data = await productionService.getByMonth(month);
      set({ entries: data });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message ?? "Failed to fetch entries.",
      });
    } finally {
      set({ loading: false });
    }
  },

  // 👇 NEW — fetches day 1 of asOfDate's month through asOfDate itself,
  // independent of whatever `entries` currently holds. Uses its own
  // loading flag (mtdLoading) so it never fights with the main
  // loading state used by the range/month/date views.
  fetchMtd: async (asOfDate: string) => {
    if (get().mtdLoading) return;
    set({ mtdLoading: true });
    try {
      const from = monthStartISO(asOfDate);
      const data = await productionService.getByRange(from, asOfDate);
      set({ mtdEntries: data });
    } catch (err: any) {
      // Deliberately not touching the shared `error` field — an MTD
      // fetch failure shouldn't surface as an error banner on views
      // that aren't even displaying MTD figures.
      set({ mtdEntries: [] });
    } finally {
      set({ mtdLoading: false });
    }
  },

  saveEntries: async (entries: ProductionEntryPayload[]) => {
    set({ saving: true, error: null });
    try {
      const saved = await productionService.bulkCreate(entries);
      set((state) => ({
        entries: [
          ...state.entries.filter(
            (e) =>
              !saved.some(
                (s) =>
                  s.product_id === e.product_id &&
                  s.production_date === e.production_date,
              ),
          ),
          ...saved,
        ],
      }));
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Failed to save entries." });
      throw err;
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