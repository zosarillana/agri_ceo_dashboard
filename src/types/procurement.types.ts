export type ProcurementStatus = 'received' | 'pending' | 'delayed';

export interface ProcurementRecord {
  id: number;
  product_id: number | null;
  item_name: string;
  supplier: string | null;
  quantity: number;
  unit: string;
  status: ProcurementStatus;
  procurement_date: string;
  product?: {
    id: number;
    name: string;
  };
}

export interface ProcurementSummary {
  total_items: number;
  received: number;
  delayed: number;
  pending: number;
}

export interface CreateProcurementDTO {
  item_name: string;
  supplier?: string | null;
  quantity: number;
  unit?: string;
  status?: ProcurementStatus;
}