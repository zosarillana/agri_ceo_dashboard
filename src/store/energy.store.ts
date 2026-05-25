// src/stores/energy.store.ts

import { create } from "zustand";
import { energyService } from "@/services/energy.service";
import {
  EnergyRecord,
  EnergyPayload,
  EnergySummary,
  
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

  fetchAll: () => Promise<void>;
  fetchByMonth: (month: string) => Promise<void>;
  fetchSummary: () => Promise<void>;
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

  fetchAll: async () => {
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

  fetchByMonth: async (month: string) => {
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

  fetchSummary: async () => {
    try {
      const res = await energyService.getSummary();
      set({ summary: res.data });
    } catch (err: any) {
      set({ error: "Failed to fetch summary." });
    }
  },

  saveBulk: async (rows: EnergyPayload[]) => {
    set({ saving: true, error: null });
    try {
      await energyService.storeBulk(rows);

      // refresh after save
      const { month } = get();
      if (month) {
        await get().fetchByMonth(month);
      } else {
        await get().fetchAll();
      }

      await get().fetchSummary();
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