// src/types/import.types.ts

export type ImportColumnRole =
  | "product_name"
  | "actual_output"
  | "target_output"
  | "remarks"
  | null;

export type ImportTemplateColumn = {
  letter: string;
  label: string;
  db_column: string;
  role?: ImportColumnRole;
};

export type ImportTemplate = {
  id: number;
  name: string;
  header_row: number;
  signature: string[];
  column_map: ImportTemplateColumn[];
};

export type ProductionSyncStats = {
  matched: number;
  skipped: number;
  unmatched_names: string[];
};

export type ImportResult = {
  template: ImportTemplate;
  imported_rows: number;
  production_sync?: ProductionSyncStats;
};

// A column as parsed client-side from the sheet, before it's mapped
export type ParsedColumn = {
  letter: string;
  label: string;
};

export type ImportRow = {
  id: number;
  import_template_id: number;
  sheet_name: string;
  source_file: string | null;
  row_number: number;
  // Backend inserts this as a pre-encoded JSON string via a raw
  // ImportRow::insert() call (bypasses Eloquent casts), so it can come
  // back as either a string or an already-decoded object depending on
  // how it was fetched. Always branch on typeof before using it.
  data: string | Record<string, unknown>;
  imported_at: string;
  template?: ImportTemplate;
};

export type PaginatedImportRows = {
  data: ImportRow[];
  total: number;
  current_page: number;
  per_page: number;
  last_page: number;
};