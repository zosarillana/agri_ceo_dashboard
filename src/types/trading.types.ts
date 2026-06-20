export type Market = "Export" | "Local" | "CWC";

export interface TradeItem {
  id: number;
  name: string;
  code: string;
  input: string | null;
  output: string | null;
  market: Market | null;
}

export interface Trade {
  id: number;
  trade_item_id: number;
  trade_item?: TradeItem;
  trade_date: string;
  market: Market;
  counterparty: string | null;
  input_kg: number;        // Changed from price_per_kg
  output_kg: number;       // Changed from quantity_kg
  total_value: number;
  created_at: string;
  updated_at: string;
}

export interface TradePayload {
  trade_item_id: number;
  market: Market;
  counterparty: string | null;
  input_kg: number;        // Changed from price_per_kg
  output_kg: number;       // Changed from quantity_kg
}

export interface TradeSummary {
  total_volume: number;
  total_value: number;
  avg_price: number;
  total_orders: number;
  export_orders: number;
  local_orders: number;
  cwc_orders: number;
  from: string | null;
  to: string | null;
}