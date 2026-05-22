// src/services/energy.service.ts

import api from "@/lib/api";
import {
  EnergyRecord,
  EnergyPayload,
  EnergySummary,
} from "@/types/energy.types";

export const energyService = {
  storeBulk: async (
    rows: EnergyPayload[]
  ): Promise<{ message: string; data: EnergyRecord[] }> => {
    const response = await api.post("api/energy/bulk", {
      rows,
    });
    return response.data;
  },

  getAll: async (): Promise<{ data: { account2: EnergyRecord[]; account3: EnergyRecord[] } }> => {
    const response = await api.get("api/energy");
    return response.data;
  },

  getByMonth: async (
    month: string
  ): Promise<{ data: { account2: EnergyRecord[]; account3: EnergyRecord[] } }> => {
    const response = await api.get(`api/energy/month?month=${month}`);
    return response.data;
  },

  getSummary: async (): Promise<{ data: EnergySummary }> => {
    const response = await api.get("api/energy/summary");
    return response.data;
  },
};