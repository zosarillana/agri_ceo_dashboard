import { Product } from "./products.types";

// CHANGE THIS: Update the payload type to match Laravel backend
export type ProductionEntryPayload = {
  product_id: number;
  production_date: string;  // ← changed from 'date'
  actual_output: number;    // ← changed from 'actual'
  target_output: number;    // ← changed from 'target'
  remarks?: string | null;  // ← added optional remarks field
};

export type ProductionEntry = {
  id: number;
  product_id: number;
  production_date: string;
  actual_output: number;
  target_output: number;
  remarks?: string | null;
  product?: { id: number; name: string; unit: string };
};


export type DailyProductionFormProps = {
  products: Product[];
  entries: ProductionEntry[];
  onSave?: () => void;
  initialDate?: string; 
}
