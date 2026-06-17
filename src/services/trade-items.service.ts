// src/services/trade-items.service.ts

import api from "@/lib/api";
import { TradeItem } from "@/types/trading.types";

interface TradeItemPayload {
  name: string;
  code: string;
  input?: string | null;
  output?: string | null;
  market?: string | null;
}

class TradeItemsService {
  private readonly baseUrl = "api/trade-items";

  async getAll(): Promise<{ data: TradeItem[] }> {
    const response = await api.get(this.baseUrl);
    console.log("📥 Raw API response (getAll):", response.data);
    // Handle different response structures
    const items = response.data.data ?? response.data ?? [];
    return { data: items };
  }

  async create(payload: TradeItemPayload): Promise<{ data: TradeItem }> {
    // Ensure we're sending the data correctly
    const dataToSend = {
      name: payload.name,
      code: payload.code,
      ...(payload.input !== undefined && { input: payload.input }),
      ...(payload.output !== undefined && { output: payload.output }),
      ...(payload.market !== undefined && { market: payload.market }),
    };
    
    console.log("🚀 Sending POST request to:", this.baseUrl);
    console.log("📦 Request payload:", dataToSend);
    
    const response = await api.post(this.baseUrl, dataToSend);
    
    console.log("📥 Raw API response (create):", response.data);
    return { data: response.data };
  }

  async update(id: number, payload: TradeItemPayload): Promise<{ data: TradeItem }> {
    const dataToSend = {
      name: payload.name,
      code: payload.code,
      ...(payload.input !== undefined && { input: payload.input }),
      ...(payload.output !== undefined && { output: payload.output }),
      ...(payload.market !== undefined && { market: payload.market }),
    };
    
    console.log(`🚀 Sending PUT request to: ${this.baseUrl}/${id}`);
    console.log("📦 Request payload:", dataToSend);
    
    const response = await api.put(`${this.baseUrl}/${id}`, dataToSend);
    
    console.log("📥 Raw API response (update):", response.data);
    return { data: response.data };
  }

  async delete(id: number): Promise<void> {
    console.log(`🗑️ Deleting item ${id}`);
    await api.delete(`${this.baseUrl}/${id}`);
  }
}

export const tradeItemsService = new TradeItemsService();