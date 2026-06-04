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
  asp_per_kg: number;
  quantity_kg: number;
  total_sales_usd: number;
  sale_date: string; // Added this field
  created_at: string;
  updated_at: string;
}

export interface SalePayload {
  product_id: number;
  market: Market;
  asp_per_kg: number;
  quantity_kg: number;
}

export interface SalesSummary {
  total_sales_usd: number;
  total_quantity_kg: number;
  export_count: number;
  local_count: number;
  from: string | null;
  to: string | null;
  detailed_summary: {
    product_id: number;
    product_name: string;
    total_sales_usd: number;
    total_quantity_kg: number;
    export_count: number;
    local_count: number;
  }[];
}