// src/store/account.store.ts

import { create } from "zustand";
import { accountService } from "@/services/accounts.service";
import { Account, AccountPayload, AccountSummary } from "@/types/accounts.types";

interface DateRange {
  from: string | null;
  to: string | null;
}

interface AccountStore {
  accounts: Account[];
  summary: AccountSummary;
  dateRange: DateRange;
  loading: boolean;
  saving: boolean;
  error: string | null;

  fetchAll: (from?: string, to?: string) => Promise<void>;
  setDateRange: (range: DateRange) => void;
  clearDateRange: () => void;
  saveAccount: (payload: AccountPayload) => Promise<void>;
  updateAccount: (id: number, payload: Partial<AccountPayload>) => Promise<void>;
  deleteAccount: (id: number) => Promise<void>;
  markPaid: (id: number) => Promise<void>;
  clearError: () => void;
}

const defaultSummary: AccountSummary = {
  total_receivable: 0,
  total_payable: 0,
  total_capex: 0,
  total_opex: 0,
  from: null,
  to: null,
};

export const useAccountStore = create<AccountStore>((set, get) => ({
  accounts: [],
  summary: defaultSummary,
  dateRange: { from: null, to: null },
  loading: false,
  saving: false,
  error: null,

  fetchAll: async (from?: string, to?: string) => {
    const targetFrom = from ?? null;
    const targetTo = to ?? null;

    if (get().loading || (
      get().accounts.length > 0 && 
      get().dateRange.from === targetFrom && 
      get().dateRange.to === targetTo
    )) return;

    set({ loading: true, error: null });
    try {
      const response = await accountService.getAll(from, to);
      const accounts = response.data;

      // Compute summary client-side
      const summary: AccountSummary = {
        total_receivable: accounts
          .filter((a) => a.type === "receivable" || a.type === "revenue")
          .reduce((s, a) => s + a.amount, 0),
        total_payable: accounts
          .filter((a) => a.type === "payable" || a.type === "expense")
          .reduce((s, a) => s + a.amount, 0),
        total_capex: accounts
          .filter((a) => a.type === "capex")
          .reduce((s, a) => s + a.amount, 0),
        total_opex: accounts
          .filter((a) => a.type === "opex")
          .reduce((s, a) => s + a.amount, 0),
        from: from ?? null,
        to: to ?? null,
      };

      set({ accounts, summary, dateRange: { from: targetFrom, to: targetTo } });
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Failed to fetch accounts." });
    } finally {
      set({ loading: false });
    }
  },

  setDateRange: (range) => {
    set({ dateRange: range });
    get().fetchAll(range.from ?? undefined, range.to ?? undefined);
  },

  clearDateRange: () => {
    set({ dateRange: { from: null, to: null } });
    get().fetchAll();
  },

  saveAccount: async (payload) => {
    set({ saving: true, error: null });
    try {
      await accountService.store(payload);
      const { from, to } = get().dateRange;
      await get().fetchAll(from ?? undefined, to ?? undefined);
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Failed to save account." });
      throw err;
    } finally {
      set({ saving: false });
    }
  },

  updateAccount: async (id, payload) => {
    set({ saving: true, error: null });
    try {
      await accountService.update(id, payload);
      const { from, to } = get().dateRange;
      await get().fetchAll(from ?? undefined, to ?? undefined);
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Failed to update account." });
      throw err;
    } finally {
      set({ saving: false });
    }
  },

  deleteAccount: async (id) => {
    set({ saving: true, error: null });
    try {
      await accountService.delete(id);
      const { from, to } = get().dateRange;
      await get().fetchAll(from ?? undefined, to ?? undefined);
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Failed to delete account." });
      throw err;
    } finally {
      set({ saving: false });
    }
  },

  markPaid: async (id) => {
    set({ saving: true, error: null });
    try {
      await accountService.markPaid(id);
      const { from, to } = get().dateRange;
      await get().fetchAll(from ?? undefined, to ?? undefined);
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Failed to mark as paid." });
      throw err;
    } finally {
      set({ saving: false });
    }
  },

  clearError: () => set({ error: null }),
}));