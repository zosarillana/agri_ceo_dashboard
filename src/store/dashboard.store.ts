import { create } from "zustand";
import { dashboardService } from "@/services/dashboard.service";
import type { DashboardStats } from "@/types/dashboard.types";

type DashboardStore = {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  activeDate: string;

  setStats: (stats: DashboardStats) => void;
  fetchStats: (date?: string) => Promise<void>;
};

function getTodayISO() {
  return new Date().toISOString().split("T")[0];
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  stats: null,
  loading: false,
  error: null,
  activeDate: getTodayISO(),

  // Hydrate from loader data without triggering a network call
  setStats: (stats) => set({ stats }),

  fetchStats: async (date?: string) => {
    const target = date ?? getTodayISO();

    // Guard against concurrent calls and redundant fetches for the same date
    if (get().loading || (get().stats !== null && get().activeDate === target)) return;

    set({ loading: true, error: null, activeDate: target });
    try {
      const data = await dashboardService.getStats(target);
      set({ stats: data });
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Failed to fetch dashboard stats." });
    } finally {
      set({ loading: false });
    }
  },
}));