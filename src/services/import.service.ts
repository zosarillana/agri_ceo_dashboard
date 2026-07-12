// src/services/import.service.ts
import api from "@/lib/api";
import { ImportResult, ImportTemplate, PaginatedImportRows } from "@/types/import.types";

export const importService = {
  async getTemplates(): Promise<ImportTemplate[]> {
    const res = await api.get("/api/import-templates");
    // Backend may return a plain array or a paginated { data: [...] } shape
    // depending on whether ImportTemplateController::index() paginates.
    return Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
  },

  // Matches the filters ImportRowController::index() already accepts:
  // template_id, sheet_name, search, from_date, to_date, page, per_page.
  async getImportRows(params: {
    page?: number;
    per_page?: number;
    template_id?: number | string;
    search?: string;
  }): Promise<PaginatedImportRows> {
    const res = await api.get("/api/imports", { params });
    return res.data;
  },

  // NOTE: unlike productionService.create(), the import controller
  // (SpreadsheetImportController::store) returns the result object
  // directly — { template, imported_rows, production_sync } — not
  // wrapped in a Laravel API Resource's { data: ... } envelope. So this
  // returns res.data as-is, not res.data.data.
  async submitImport(form: FormData): Promise<ImportResult> {
    // Deliberately no Content-Type header here — the browser needs to set
    // multipart/form-data itself so it can attach the correct boundary.
    // Setting the header manually (even to the "right" value) strips that
    // boundary and the request body becomes unparseable on the Laravel side.
    const res = await api.post("/api/imports", form);
    return res.data;
  },
};