// services/sales.service.ts
import api from "@/lib/api";
import { Sale } from "@/types/sales.types";

export const salesService = {
  storeBulk: async (
    rows: any[],
    saleDate?: string,
  ): Promise<{ message: string; data: Sale[] }> => {
    const response = await api.post("api/sales/bulk", {
      rows,
      sale_date: saleDate,
    });
    return response.data;
  },

  getLatest: async (from?: string, to?: string): Promise<{ data: Sale[] }> => {
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    const response = await api.get(`api/sales/latest?${params.toString()}`);
    return response.data;
  },

  // src/services/sales.service.ts  — add this method
  getSummary: async (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    const res = await api.get(`api/sales/summary?${params.toString()}`);
    return res.data; // { data: { total_sales_usd, total_quantity_kg, ... , detailed_summary: [] } }
  },
};
