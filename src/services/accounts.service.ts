// src/services/accounts.service.ts

import api from "@/lib/api";
import { Account, AccountPayload, AccountStatus } from "@/types/accounts.types";

class AccountService {
  private readonly baseUrl = "api/accounts";

  async getAll(from?: string, to?: string): Promise<{ data: Account[] }> {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;

    const response = await api.get(this.baseUrl, { params });
    const accounts: Account[] = (response.data.data ?? []).map((a: any) => ({
      ...a,
      amount: parseFloat(a.amount),
    }));

    return { data: accounts };
  }

  async getSummary(from?: string, to?: string): Promise<{ data: any }> {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;

    const response = await api.get(`${this.baseUrl}/summary`, { params });
    return { data: response.data.data };
  }

  async store(payload: AccountPayload): Promise<{ data: Account }> {
    const response = await api.post(this.baseUrl, payload);
    return { data: response.data.data };
  }

  async update(id: number, payload: Partial<AccountPayload>): Promise<{ data: Account }> {
    const response = await api.put(`${this.baseUrl}/${id}`, payload);
    return { data: response.data.data };
  }

  async delete(id: number): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  async updateStatus(id: number, status: AccountStatus): Promise<{ data: Account }> {
    const response = await api.patch(`${this.baseUrl}/${id}/status`, { status });
    return { data: response.data.data };
  }
}

export const accountService = new AccountService();