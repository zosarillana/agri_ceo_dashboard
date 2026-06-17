import api from "@/lib/api";
import { Trade, TradePayload } from "@/types/trading.types";

class TradingService {
  private readonly baseUrl = "api/trades";

  /**
   * Get latest trades with optional date range filter
   */
  async getLatest(from?: string, to?: string): Promise<{ data: Trade[] }> {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;

    const response = await api.get(this.baseUrl, { params });

    const trades: Trade[] = (response.data.data ?? response.data ?? []).map(
      (t: any) => ({
        ...t,
        price_per_kg: parseFloat(t.price_per_kg),
        quantity_kg: parseFloat(t.quantity_kg),
        total_value: parseFloat(t.total_value),
      }),
    );

    return { data: trades };
  }

  /**
   * Store bulk trades for a specific date (UPSERT - update or create)
   */
  async storeBulk(
    payload: TradePayload[],
    tradeDate?: string,
  ): Promise<{ data: Trade[] }> {
    const requestBody: Record<string, any> = { rows: payload };
    if (tradeDate) requestBody.trade_date = tradeDate;

    const response = await api.post(`${this.baseUrl}/bulk`, requestBody);
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