// src/services/production.service.ts
import api from "@/lib/api";
import { ProductionEntry, ProductionEntryPayload } from "@/types/production.types";

export const productionService = {
  async getAll(): Promise<ProductionEntry[]> {
    const res = await api.get("/api/production-entries");
    return res.data;
  },

  async getByDate(date: string): Promise<ProductionEntry[]> {
    const res = await api.get(`/api/production-entries?date=${date}`);
    return res.data;
  },

  async create(payload: ProductionEntryPayload): Promise<ProductionEntry> {
    const res = await api.post("/api/production-entries", payload);
    return res.data.data;
  },

  async update(id: number, payload: Partial<ProductionEntryPayload>): Promise<ProductionEntry> {
    const res = await api.put(`/api/production-entries/${id}`, payload);
    return res.data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/production-entries/${id}`);
  },

  // Saves multiple entries — one per product — sequentially
  async bulkCreate(entries: ProductionEntryPayload[]): Promise<ProductionEntry[]> {
    const results = await Promise.all(entries.map((e) => productionService.create(e)));
    return results;
  },
};