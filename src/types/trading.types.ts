// src/types/trading.types.ts

export type Market = "Export" | "Local";

export interface Trade {
  id: number;
  product_id: number;
  product?: {
    id: number;
    name: string;
    unit?: string;
  };
  trade_date: string;
  market: Market;
  counterparty: string | null;
  price_per_kg: number;
  quantity_kg: number;
  total_value: number;
  created_at: string;
  updated_at: string;
}

export interface TradePayload {
  product_id: number;
  market: Market;
  counterparty: string | null;
  price_per_kg: number;
  quantity_kg: number;
}

export interface TradeSummary {
  total_volume: number;
  total_value: number;
  avg_price: number;
  total_orders: number;
  export_orders: number;
  local_orders: number;
  from: string | null;
  to: string | null;
}