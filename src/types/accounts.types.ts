// src/types/account.types.ts

export type AccountType = "receivable" | "revenue" | "payable" | "expense" | "capex" | "opex";

export interface Account {
  id: number;
  description: string;
  type: AccountType;
  amount: number;
  due_date: string | null;
  notes: string | null;
  is_paid: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountPayload {
  description: string;
  type: AccountType;
  amount: number;
  due_date: string | null;
  notes: string | null;
  is_paid?: boolean;
}

export interface AccountSummary {
  total_receivable: number;
  total_payable: number;
  total_capex: number;
  total_opex: number;
  from: string | null;
  to: string | null;
}