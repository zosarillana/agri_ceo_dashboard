// src/types/accounts.types.ts

export type AccountType = "receivable" | "revenue" | "payable" | "expense" | "capex" | "opex";

// Status is scoped by type:
//   receivable/revenue → "received" | "delayed"
//   payable/expense    → "unpaid"   | "paid"
//   capex/opex         → "unpaid"   | "pending" | "paid"
export type AccountStatus = "received" | "delayed" | "unpaid" | "pending" | "paid";

export interface Account {
  id: number;
  description: string;
  type: AccountType;
  amount: number;
  due_date: string | null;
  notes: string | null;
  status: AccountStatus;
  created_at: string;
  updated_at: string;
}

export interface AccountPayload {
  description: string;
  type: AccountType;
  amount: number;
  due_date: string | null;
  notes: string | null;
  status?: AccountStatus;
}

export interface AccountSummary {
  total_receivable: number;
  total_payable: number;
  total_capex: number;
  total_opex: number;
  from: string | null;
  to: string | null;
}