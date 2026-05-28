// src/services/qc.service.ts

import api from "@/lib/api";
import { QcRecord, QcSummary } from "@/types/qc.types";

export const qcService = {
  storeBulk: async (
    rows: { product_id: number; tested: number; passed: number }[],
    qcDate?: string
  ): Promise<{ message: string; data: QcRecord[] }> => {
    const response = await api.post("api/qc/bulk", {
      rows,
      qc_date: qcDate,
    });
    return response.data;
  },

  getLatest: async (
    from?: string,
    to?: string
  ): Promise<{ data: QcRecord[] }> => {
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    const response = await api.get(`api/qc/latest?${params.toString()}`);
    return response.data;
  },

  getSummary: async (
    from?: string,
    to?: string
  ): Promise<{ data: QcSummary }> => {
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    const response = await api.get(`api/qc/summary?${params.toString()}`);
    return response.data;
  },
};