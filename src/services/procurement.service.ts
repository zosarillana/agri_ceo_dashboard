import api from "@/lib/api";
import { ProcurementRecord, ProcurementSummary, CreateProcurementDTO } from "@/types/procurement.types";

export const procurementService = {
  getAll: (from?: string, to?: string) =>
    api.get<ProcurementRecord[]>("api/procurement", { params: { from, to } }),

  getSummary: (from?: string, to?: string) =>
    api.get<ProcurementSummary>("api/procurement/summary", { params: { from, to } }),

  storeBulk: (rows: CreateProcurementDTO[], date?: string) =>
    api.post<ProcurementRecord[]>("api/procurement/bulk", { rows, date }),
};