// src/stores/plant.store.ts
import { create } from "zustand";
import { plantService } from "@/services/maintenance.service";
import { Plant, PlantStatusSummary } from "@/types/maintenance.types";

type PlantStore = {
  plants: Plant[];
  summary: PlantStatusSummary[];
  loading: boolean;
  error: string | null;

  fetchPlants: () => Promise<void>;
  fetchPlant: (plantId: number) => Promise<void>;
  fetchSummary: () => Promise<void>;
};

export const usePlantStore = create<PlantStore>((set) => ({
  plants: [],
  summary: [],
  loading: false,
  error: null,

  /**
   * Load all plants with their units and sub-units.
   * This is what the maintenance dashboard calls on mount.
   */
  fetchPlants: async () => {
    set({ loading: true, error: null });
    try {
      const data = await plantService.getAll();
      set({ plants: data });
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Failed to fetch plants." });
    } finally {
      set({ loading: false });
    }
  },

  /**
   * Reload a single plant in-place without blowing away the rest.
   */
  fetchPlant: async (plantId: number) => {
    set({ loading: true, error: null });
    try {
      const updated = await plantService.getById(plantId);
      set((state) => ({
        plants: state.plants.map((p) => (p.id === plantId ? updated : p)),
      }));
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Failed to fetch plant." });
    } finally {
      set({ loading: false });
    }
  },

  /**
   * Status counts per plant — operational / maintenance / down / standby.
   */
  fetchSummary: async () => {
    set({ loading: true, error: null });
    try {
      const data = await plantService.getSummary();
      set({ summary: data });
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Failed to fetch summary." });
    } finally {
      set({ loading: false });
    }
  },
}));