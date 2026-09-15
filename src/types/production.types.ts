//src\types\production.types.ts
import { Product } from "./products.types";

// CHANGE THIS: Update the payload type to match Laravel backend
export type ProductionEntryPayload = {
  product_id: number;
  production_date: string;
  actual_output: number;
  target_output: number;
  dly_target?: number;
  dly_yield?: number;
  mtd_target?: number;
  mtd_yield?: number;
  remarks?: string | null;
};

export type ProductionEntry = {
  id: number;
  product_id: number;
  production_date: string;
  actual_output: number;
  target_output: number;
  dly_target: number;
  dly_yield: number;
  mtd_target: number;
  mtd_yield: number;
  remarks?: string | null;
  product?: { id: number; name: string; unit: string };
};


export type DailyProductionFormProps = {
  products: Product[];
  entries: ProductionEntry[];
  onSave?: () => void;
  initialDate?: string; 
}
