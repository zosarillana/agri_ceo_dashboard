import api from "@/lib/api";
import { DashboardStats } from "@/types/dashboard.types";

export const dashboardService = {
  async getStats(date?: string): Promise<DashboardStats> {
    const params = date ? { date } : {};
    const res = await api.get("/api/dashboard", { params });
    return res.data.data;
  },
};