import { create } from "zustand";
import { dashboardService } from "@/services/dashboard.service";
import type { DashboardStats } from "@/types/dashboard.types";
import { getTodayISO } from "@/lib/dashboard-utils";

type DashboardStore = {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  activeDate: string;

  setStats: (stats: DashboardStats) => void;
  fetchStats: (date?: string, force?: boolean) => Promise<void>; // Add force param
};

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  stats: null,
  loading: false,
  error: null,
  activeDate: getTodayISO(),

  setStats: (stats) => set({ stats }),

  fetchStats: async (date?: string, force: boolean = false) => {
    const target = date ?? getTodayISO();

    // Allow force refresh to bypass the cache check
    if (!force) {
      if (get().loading || (get().stats !== null && get().activeDate === target)) {
        return;
      }
    }

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