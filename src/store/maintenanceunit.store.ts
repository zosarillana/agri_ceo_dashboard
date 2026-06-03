// src/stores/maintenanceUnit.store.ts
import { create } from "zustand";
import { unitService } from "@/services/maintenance.service";
import { usePlantStore } from "@/store/plant.store";
import {
  CreateUnitPayload,
  UpdateUnitPayload,
} from "@/types/maintenance.types";

type MaintenanceUnitStore = {
  saving: boolean;
  deleting: boolean;
  error: string | null;

  createUnit: (payload: CreateUnitPayload) => Promise<void>;
  updateUnit: (unitId: number, payload: UpdateUnitPayload) => Promise<void>;
  deleteUnit: (unitId: number, plantId: number) => Promise<void>;
};

export const useMaintenanceUnitStore = create<MaintenanceUnitStore>((set) => ({
  saving: false,
  deleting: false,
  error: null,

  /**
   * Create a new unit or sub-unit.
   * After creation, refreshes the parent plant so the UI stays in sync.
   */
  createUnit: async (payload: CreateUnitPayload) => {
    set({ saving: true, error: null });
    try {
      await unitService.create(payload);
      // ✅ Should be
      await usePlantStore.getState().fetchPlant(payload.plant_id);
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Failed to create unit." });
      throw err;
    } finally {
      set({ saving: false });
    }
  },

  /**
   * Update a unit's status, notes, or schedule.
   * Refreshes the affected plant after update.
   */
  updateUnit: async (unitId: number, payload: UpdateUnitPayload) => {
    set({ saving: true, error: null });
    try {
      const updated = await unitService.update(unitId, payload);
      // Updated unit carries plant_id — refresh that plant
      await usePlantStore.getState().fetchPlant(updated.id);
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Failed to update unit." });
      throw err;
    } finally {
      set({ saving: false });
    }
  },

  /**
   * Soft-delete a unit.
   * plantId is required to know which plant to refresh after deletion.
   */
  deleteUnit: async (unitId: number, plantId: number) => {
    set({ deleting: true, error: null });
    try {
      await unitService.delete(unitId);
      await usePlantStore.getState().fetchPlant(plantId);
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Failed to delete unit." });
      throw err;
    } finally {
      set({ deleting: false });
    }
  },
}));
