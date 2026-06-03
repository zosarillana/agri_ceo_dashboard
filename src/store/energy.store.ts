// src/stores/energy.store.ts

import { create } from "zustand";
import { energyService } from "@/services/energy.service";
import {
  EnergyRecord,
  EnergyPayload,
  EnergySummary,
  AccountKey,
} from "@/types/energy.types";

interface EnergyState {
  data: {
    account2: EnergyRecord[];
    account3: EnergyRecord[];
  };

  summary: EnergySummary;

  month: string;
  loading: boolean;
  saving: boolean;
  error: string | null;

  fetchAll: (force?: boolean) => Promise<void>;
  fetchByMonth: (month: string, force?: boolean) => Promise<void>;
  fetchSummary: (force?: boolean) => Promise<void>;
  saveBulk: (rows: EnergyPayload[]) => Promise<void>;
  setMonth: (month: string) => void;
}

const defaultSummary: EnergySummary = {
  total_billed_amount: 0,
  total_kw: 0,
  total_demand: 0,
  account2_total: 0,
  account3_total: 0,
};

export const useEnergyStore = create<EnergyState>((set, get) => ({
  data: { account2: [], account3: [] },
  summary: defaultSummary,
  month: "",
  loading: false,
  saving: false,
  error: null,

  fetchAll: async (force = false) => {
    const hasData = get().data.account2.length > 0 || get().data.account3.length > 0;
    if (get().loading || (hasData && !force)) return;
    set({ loading: true, error: null });
    try {
      const res = await energyService.getAll();
      set({ data: res.data });
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Failed to fetch energy data." });
    } finally {
      set({ loading: false });
    }
  },

  fetchByMonth: async (month: string, force = false) => {
    const hasData = get().data.account2.length > 0 || get().data.account3.length > 0;
    if (get().loading || (get().month === month && hasData && !force)) return;
    set({ loading: true, error: null, month });
    try {
      const res = await energyService.getByMonth(month);
      set({ data: res.data });
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Failed to fetch month data." });
    } finally {
      set({ loading: false });
    }
  },

  fetchSummary: async (force = false) => {
    if (get().loading || (get().summary.total_billed_amount !== 0 && !force)) return;
    set({ loading: true, error: null });
    try {
      const res = await energyService.getSummary();
      set({ summary: res.data });
    } catch (err: any) {
      set({ error: "Failed to fetch summary." });
    } finally {
      set({ loading: false });
    }
  },

  saveBulk: async (rows: EnergyPayload[]) => {
    set({ saving: true, error: null });
    try {
      await energyService.storeBulk(rows);

      // refresh after save
      const { month } = get();
      if (month) {
        await get().fetchByMonth(month, true);
      } else {
        await get().fetchAll(true);
      }

      await get().fetchSummary(true);
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Failed to save energy data." });
      throw err;
    } finally {
      set({ saving: false });
    }
  },

  setMonth: (month: string) => {
    set({ month });
  },
}));