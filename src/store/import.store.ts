// src/stores/import.store.ts
import { create } from "zustand";
import { importService } from "@/services/import.service";
import { ImportResult, ImportTemplate } from "@/types/import.types";

type ImportStore = {
  templates: ImportTemplate[];
  loadingTemplates: boolean;
  submitting: boolean;
  error: string | null;
  lastResult: ImportResult | null;

  fetchTemplates: () => Promise<void>;
  submit: (form: FormData) => Promise<ImportResult>;
  reset: () => void;
};

export const useImportStore = create<ImportStore>((set) => ({
  templates: [],
  loadingTemplates: false,
  submitting: false,
  error: null,
  lastResult: null,

  fetchTemplates: async () => {
    set({ loadingTemplates: true, error: null });
    try {
      const data = await importService.getTemplates();
      set({ templates: data });
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Failed to fetch templates." });
    } finally {
      set({ loadingTemplates: false });
    }
  },

  submit: async (form: FormData) => {
    set({ submitting: true, error: null });
    try {
      const result = await importService.submitImport(form);
      set({ lastResult: result });
      return result;
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? "Import failed." });
      throw err; // re-throw so the form can catch it, same pattern as production.store.ts
    } finally {
      set({ submitting: false });
    }
  },

  reset: () => set({ error: null, lastResult: null }),
}));