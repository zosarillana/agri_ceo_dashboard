// src/types/qc.types.ts

export interface QcRecord {
  id: number;
  product_id: number;
  product?: {
    id: number;
    name: string;
    unit?: string;
  };
  tested: number;
  passed: number;
  failed: number;
  pass_rate: number;
  rejection_rate: number;
  qc_date: string;
  created_at: string;
  updated_at: string;
}

export interface QcPayload {
  product_id: number;
  tested: number;
  passed: number;
}

export interface QcSummary {
  samples_tested: number;
  samples_passed: number;
  samples_failed: number;
  pass_rate: number;
  rejection_rate: number;
  products_tested: number;
  from: string | null;
  to: string | null;
}

// Add this new type for the form rows
export interface QCRow {
  product_id: number;
  label: string;
  tested: string;
  passed: string;
  isReadOnly: boolean;
}