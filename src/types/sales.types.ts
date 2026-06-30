// src/types/sales.types.ts

export type Market = 'Export' | 'Local';

export interface Sale {
  id: number;
  product_id: number;
  product?: {
    id: number;
    name: string;
    unit?: string;
  };
  market: Market;
  sales: number;
  asp_per_kg: number;
  asp_total_usd: number;
  quantity_kg: number;
  total_sales_usd: number;
  sale_date: string;
  created_at: string;
  updated_at: string;
}

export interface SalePayload {
  product_id: number;
  market: Market;
  sales: number;
  asp_per_kg: number;
  quantity_kg: number;
}

export interface SalesSummary {
  total_sales_usd: number;
  total_sales_raw: number;
  total_quantity_kg: number;
  asp_total_usd: number;
  export_count: number;
  local_count: number;
  from: string | null;
  to: string | null;
  detailed_summary: {
    product_id: number;
    market: Market;
    total_quantity_kg: number;
    total_sales_usd: number;
    total_sales_raw: number;
    asp_total_usd: number;
  }[];
}