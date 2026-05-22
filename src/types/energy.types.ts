// src/types/energy.types.ts

export type AccountKey = "account2" | "account3";

export interface EnergyRecord {
  id: number;
  account: AccountKey;
  billing_month: string; // YYYY-MM-01
  kw: number;
  demand: number;
  billed_amount: number;
  created_at: string;
  updated_at: string;
}

export interface EnergyPayload {
  account: AccountKey;
  month: string; // YYYY-MM
  kw: number;
  demand: number;
  billedAmount: number;
}

export interface EnergySummary {
  total_billed_amount: number;
  total_kw: number;
  total_demand: number;
  account2_total: number;
  account3_total: number;
}