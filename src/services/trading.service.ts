// src/services/trading.service.ts

import api from "@/lib/api";
import { Trade, TradePayload } from "@/types/trading.types";

class TradingService {
  private readonly baseUrl = "api/trades";

  /**
   * Get trades with optional date range filter
   */
  // src/services/trading.service.ts

  async getLatest(from?: string, to?: string): Promise<{ data: Trade[] }> {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;

    const response = await api.get(this.baseUrl, { params });

    // ✅ Parse numeric strings to actual numbers here
    const trades: Trade[] = (response.data.data ?? []).map((t: any) => ({
      ...t,
      price_per_kg: parseFloat(t.price_per_kg),
      quantity_kg: parseFloat(t.quantity_kg),
      total_value: parseFloat(t.total_value),
    }));

    return { data: trades };
  }
  /**
   * Store bulk trades for a specific date (UPSERT - update or create)
   */
  async storeBulk(
    payload: TradePayload[],
    tradeDate?: string,
  ): Promise<{ data: Trade[] }> {
    const params: Record<string, string> = {};
    if (tradeDate) params.trade_date = tradeDate;

    // Wrap the payload in a 'rows' object to match backend expectation
    const requestBody = {
      rows: payload,
    };

    const response = await api.post(`${this.baseUrl}/bulk`, requestBody, {
      params,
    });
    return { data: response.data };
  }

  /**
   * Get trade summary for a date range
   */
  async getSummary(from?: string, to?: string): Promise<any> {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;

    const response = await api.get(`${this.baseUrl}/summary`, { params });
    return response.data;
  }

  /**
   * Delete a single trade
   */
  async deleteTrade(id: number): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * Update a single trade
   */
  async updateTrade(
    id: number,
    payload: TradePayload,
  ): Promise<{ data: Trade }> {
    const response = await api.put(`${this.baseUrl}/${id}`, payload);
    return { data: response.data };
  }
}

export const tradingService = new TradingService();
