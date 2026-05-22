// services/sales.service.ts
import api from "@/lib/api";
import { Sale, SalesSummary } from "@/types/sales.types";

export const salesService = {
  storeBulk: async (rows: any[], saleDate?: string): Promise<{ message: string; data: Sale[] }> => {
    const response = await api.post('api/sales/bulk', {
      rows,
      sale_date: saleDate
    });
    return response.data;
  },

  getLatest: async (from?: string, to?: string): Promise<{ data: Sale[] }> => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const response = await api.get(`api/sales/latest?${params.toString()}`);
    return response.data;
  },

  getSummary: async (from?: string, to?: string): Promise<{ data: SalesSummary }> => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const response = await api.get(`api/sales/summary?${params.toString()}`);
    return response.data;
  }
};