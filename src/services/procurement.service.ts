import api from "@/lib/api";
import { ProcurementRecord, ProcurementSummary, CreateProcurementDTO } from "@/types/procurement.types";

// Extended DTO that includes id for updates
export interface BulkProcurementDTO extends CreateProcurementDTO {
  id?: number; // Optional ID for updates
}

export const procurementService = {
  getAll: (from?: string, to?: string) =>
    api.get<ProcurementRecord[]>("api/procurement", { params: { from, to } }),

  getSummary: (from?: string, to?: string) =>
    api.get<ProcurementSummary>("api/procurement/summary", { params: { from, to } }),

  // This handles both creates and updates (when rows have 'id' field)
  storeBulk: (rows: BulkProcurementDTO[], date?: string) =>
    api.post<{ data: ProcurementRecord[]; message: string }>("api/procurement/bulk", { 
      rows, 
      procurement_date: date 
    }),

  // Add the delete method
  delete: (id: number) =>
    api.delete<{ message: string }>(`api/procurement/${id}`),
};