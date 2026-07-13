"use client";

import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Upload,
  FileSpreadsheet,
  CalendarIcon,
  CheckCircle2,
  AlertTriangle,
  Layers,
  X,
} from "lucide-react";

import { useImportStore } from "@/store/import.store";
import { importService } from "@/services/import.service";
import {
  ImportColumnRole,
  ImportTemplate,
  ParsedColumn,
} from "@/types/import.types";

type SheetMatch = {
  sheetName: string;
  headerRowIndex: number;
  template: ImportTemplate | null;
  date: string; // yyyy-mm-dd, editable
  include: boolean;
};

type BatchResult = {
  sheetName: string;
  status: "success" | "error" | "skipped";
  message: string;
};

const GRID_PREVIEW_ROWS = 12;
const GRID_PREVIEW_COLS = 20;
const PREVIEW_ROWS = 8;

const ROLE_OPTIONS: { value: NonNullable<ImportColumnRole> | "none"; label: string }[] = [
  { value: "none", label: "— none —" },
  { value: "product_name", label: "Product name" },
  { value: "actual_output", label: "Actual output" },
  { value: "target_output", label: "Target output" },
  { value: "remarks", label: "Remarks" },
];

function slugify(label: string): string {
  return (
    label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .replace(/^(\d)/, "col_$1") || "column"
  );
}

function looksNumeric(value: unknown): boolean {
  const s = String(value).trim();
  if (s === "") return false;
  return !isNaN(Number(s.replace(/,/g, "")));
}

// Guesses the header row: within the first 20 rows, the one with the most
// non-empty, non-numeric-looking cells (title/date blocks above the real
// table tend to have few, mostly-numeric or mostly-empty cells).
function guessHeaderRow(rawRows: string[][]): number {
  let bestIndex = 0;
  let bestScore = -1;
  const depth = Math.min(rawRows.length, 20);
  for (let i = 0; i < depth; i++) {
    const row = rawRows[i];
    const nonEmpty = row.filter((c) => String(c).trim() !== "");
    if (nonEmpty.length < 2) continue;
    const textLike = nonEmpty.filter((c) => !looksNumeric(c));
    const score = nonEmpty.length + textLike.length * 2;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }
  return bestIndex;
}

function dateToISO(d: Date) {
  return d.toLocaleDateString("en-CA");
}

// Mirrors ImportTemplate::matches() on the backend: every label in the
// template's saved signature must appear somewhere in this sheet's header
// row (case/whitespace-insensitive). Extra columns in the sheet are fine.
function clientTemplateMatches(headerLabels: string[], template: ImportTemplate): boolean {
  const incoming = new Set(
    headerLabels.map((l) => l.trim().toLowerCase()).filter((l) => l !== ""),
  );
  return template.signature.every((label) => incoming.has(label.trim().toLowerCase()));
}

const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

// Best-effort guess at a sheet's date from its tab name (e.g. "JULY 6",
// "July 6 Report"). Falls back to null when nothing recognizable is
// found — the person can always set/correct the date manually before
// importing.
function guessDateFromSheetName(name: string): string | null {
  const match = name.trim().match(/([A-Za-z]{3,9})\s+(\d{1,2})/);
  if (!match) return null;
  const [, monthPart, dayPart] = match;
  const monthLower = monthPart.toLowerCase();
  let monthIndex = MONTH_NAMES.findIndex((m) => m === monthLower);
  if (monthIndex === -1) {
    monthIndex = MONTH_NAMES.findIndex((m) => m.slice(0, 3) === monthLower.slice(0, 3));
  }
  if (monthIndex === -1) return null;
  const day = parseInt(dayPart, 10);
  if (isNaN(day) || day < 1 || day > 31) return null;
  const date = new Date(new Date().getFullYear(), monthIndex, day);
  return dateToISO(date);
}

type Props = {
  onImported?: () => void;
};

export default function ProductionImportForm({ onImported }: Props) {
  const {
    templates,
    loadingTemplates,
    submitting,
    error,
    lastResult,
    fetchTemplates,
    submit,
    reset,
  } = useImportStore();

  const inputRef = useRef<HTMLInputElement>(null);

  const [rawFile, setRawFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [headerRowIndex, setHeaderRowIndex] = useState<number | null>(null);
  const [suggestedHeaderRow, setSuggestedHeaderRow] = useState(0);
  const [showAllGridRows, setShowAllGridRows] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());
  const [columnRoles, setColumnRoles] = useState<Record<string, ImportColumnRole>>({});
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [showAllDataRows, setShowAllDataRows] = useState(false);

  const [matchedTemplate, setMatchedTemplate] = useState<ImportTemplate | null>(null);
  const [templateName, setTemplateName] = useState("");

  const [productionDate, setProductionDate] = useState<Date>(() => new Date());
  const [calOpen, setCalOpen] = useState(false);

  // Import-all-sheets mode
  const [mode, setMode] = useState<"single" | "all">("single");
  const [sheetMatches, setSheetMatches] = useState<SheetMatch[]>([]);
  const [scanningAll, setScanningAll] = useState(false);
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const resetFile = () => {
    setRawFile(null);
    setWorkbook(null);
    setSheetNames([]);
    setActiveSheet(null);
    setRawRows([]);
    setHeaderRowIndex(null);
    setSuggestedHeaderRow(0);
    setShowAllGridRows(false);
    setFileError(null);
    setSelectedColumns(new Set());
    setColumnRoles({});
    setMatchedTemplate(null);
    setTemplateName("");
    setMode("single");
    setSheetMatches([]);
    setBatchResults([]);
    reset();
  };

  const getRawRows = (ws: XLSX.WorkSheet): string[][] => {
    const ref = ws["!ref"] || "A1:A1";
    const range = XLSX.utils.decode_range(ref);
    const colCount = range.e.c + 1;
    const raw = XLSX.utils.sheet_to_json<string[]>(ws, {
      header: 1,
      defval: "",
      blankrows: true,
    });
    return raw.map((r) => Array.from({ length: colCount }, (_, i) => r[i] ?? ""));
  };

  const loadSheet = (wb: XLSX.WorkBook, name: string) => {
    const ws = wb.Sheets[name];
    const raw = getRawRows(ws);
    setActiveSheet(name);
    setRawRows(raw);
    setTemplateName(name);
    setMatchedTemplate(null);
    reset();
    const guess = raw.length ? guessHeaderRow(raw) : 0;
    setSuggestedHeaderRow(guess);
    setHeaderRowIndex(guess);
    setShowAllGridRows(false);
    setSelectedColumns(new Set());
    setColumnRoles({});
  };

  // Scans every sheet in the workbook, matches each against the saved
  // templates (client-side, using the same rule as ImportTemplate::matches
  // on the backend), and best-effort guesses a production date from the
  // sheet's tab name. Nothing is sent to the server here — this is purely
  // local so the person can review/correct matches and dates before
  // committing to the batch import.
  const scanAllSheets = useCallback(() => {
    if (!workbook) return;
    setScanningAll(true);
    setBatchResults([]);
    try {
      const matches: SheetMatch[] = sheetNames.map((name) => {
        const ws = workbook.Sheets[name];
        const raw = getRawRows(ws);
        const headerRowIndex = raw.length ? guessHeaderRow(raw) : 0;
        const headerLabels = (raw[headerRowIndex] ?? []).map((v) => String(v).trim());

        const template =
          templates.find((t) => clientTemplateMatches(headerLabels, t)) ?? null;

        return {
          sheetName: name,
          headerRowIndex,
          template,
          date: guessDateFromSheetName(name) ?? dateToISO(new Date()),
          include: template != null,
        };
      });
      setSheetMatches(matches);
    } finally {
      setScanningAll(false);
    }
  }, [workbook, sheetNames, templates]);

  useEffect(() => {
    if (mode === "all" && workbook) {
      scanAllSheets();
    }
    // Deliberately not depending on scanAllSheets itself — it's rebuilt
    // every render via useCallback, and we only want to re-scan when the
    // workbook or the switch into "all" mode actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, workbook]);

  const updateSheetMatchDate = (sheetName: string, date: string) => {
    setSheetMatches((prev) =>
      prev.map((m) => (m.sheetName === sheetName ? { ...m, date } : m)),
    );
  };

  const toggleSheetMatchInclude = (sheetName: string) => {
    setSheetMatches((prev) =>
      prev.map((m) => (m.sheetName === sheetName ? { ...m, include: !m.include } : m)),
    );
  };

  // Only toggles sheets that actually matched a template — unmatched
  // sheets have no template to import against, so their checkbox stays
  // disabled and untouched regardless of this toggle's state.
  const matchableSheetCount = sheetMatches.filter((m) => m.template).length;
  const includedSheetCount = sheetMatches.filter((m) => m.template && m.include).length;

  const toggleAllSheetMatches = () => {
    const allIncluded = includedSheetCount === matchableSheetCount && matchableSheetCount > 0;
    setSheetMatches((prev) =>
      prev.map((m) => (m.template ? { ...m, include: !allIncluded } : m)),
    );
  };

  // Imports every included, matched sheet sequentially against the
  // existing single-sheet /api/imports endpoint — no new backend route
  // needed. Sequential (not Promise.all) so the server isn't hit with N
  // concurrent multipart uploads of the same file, and so one sheet's
  // failure doesn't cancel the others.
  const submitAllSheets = async () => {
    if (!rawFile) return;
    const toImport = sheetMatches.filter((m) => m.include && m.template);
    if (toImport.length === 0) return;

    setBatchSubmitting(true);
    setBatchResults([]);
    const results: BatchResult[] = [];

    for (const match of toImport) {
      if (!match.date) {
        results.push({
          sheetName: match.sheetName,
          status: "skipped",
          message: "No date set.",
        });
        setBatchResults([...results]);
        continue;
      }
      try {
        const form = new FormData();
        form.append("file", rawFile);
        form.append("sheet_name", match.sheetName);
        form.append("production_date", match.date);
        form.append("template_id", String(match.template!.id));
        // No selected_row_indices — every non-blank row in each sheet
        // is imported in batch mode.

        const result = await importService.submitImport(form);
        const sync = result.production_sync;
        results.push({
          sheetName: match.sheetName,
          status: "success",
          message: sync
            ? `${result.imported_rows} rows logged, ${sync.matched} synced to Production Entries, ${sync.skipped} skipped.`
            : `${result.imported_rows} rows logged.`,
        });
      } catch (err: any) {
        results.push({
          sheetName: match.sheetName,
          status: "error",
          message: err?.response?.data?.message ?? "Import failed.",
        });
      }
      setBatchResults([...results]);
    }

    setBatchSubmitting(false);
    onImported?.();
  };

  const handleFile = useCallback((file: File | undefined) => {
    if (!file) return;
    setFileError(null);
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      setFileError("Please upload an .xlsx, .xls, or .csv file.");
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => setFileError("Could not read that file. Try again.");
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        if (!wb.SheetNames.length) {
          setFileError("No sheets found in this file.");
          return;
        }
        setRawFile(file);
        setWorkbook(wb);
        setSheetNames(wb.SheetNames);
        loadSheet(wb, wb.SheetNames[0]);
      } catch {
        setFileError("That file could not be parsed. Is it a valid spreadsheet?");
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const columns: ParsedColumn[] = useMemo(() => {
    if (headerRowIndex == null || !rawRows[headerRowIndex]) return [];
    const headerRow = rawRows[headerRowIndex];
    const result: ParsedColumn[] = [];
    for (let i = 0; i < headerRow.length; i++) {
      const letter = XLSX.utils.encode_col(i);
      const label = String(headerRow[i]).trim();
      let hasData = label !== "";
      if (!hasData) {
        for (
          let r = headerRowIndex + 1;
          r < Math.min(headerRowIndex + 20, rawRows.length);
          r++
        ) {
          if (rawRows[r] && String(rawRows[r][i] ?? "").trim() !== "") {
            hasData = true;
            break;
          }
        }
      }
      if (!hasData) continue;
      result.push({ letter, label: label || `Column ${letter}` });
    }
    return result;
  }, [headerRowIndex, rawRows]);

  const dataRows = useMemo(() => {
    if (headerRowIndex == null) return [];
    return rawRows
      .slice(headerRowIndex + 1)
      .filter((r) => r.some((c) => String(c).trim() !== ""));
  }, [headerRowIndex, rawRows]);

  // Default to every row selected whenever the header row (and therefore
  // the set of data rows below it) changes.
  useEffect(() => {
    setSelectedRows(new Set(dataRows.map((_, i) => i)));
    setShowAllDataRows(false);
  }, [headerRowIndex, dataRows.length]);

  const toggleRow = (index: number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  const toggleAllRows = () => {
    setSelectedRows((prev) =>
      prev.size === dataRows.length ? new Set() : new Set(dataRows.map((_, i) => i)),
    );
  };

  const toggleColumn = (letter: string) => {
    setSelectedColumns((prev) => {
      const next = new Set(prev);
      next.has(letter) ? next.delete(letter) : next.add(letter);
      return next;
    });
  };

  const setColumnRole = (letter: string, role: string) => {
    setColumnRoles((prev) => ({
      ...prev,
      [letter]: role === "none" ? null : (role as ImportColumnRole),
    }));
  };

  const hasProductNameRole = Object.values(columnRoles).includes("product_name");

  // Columns to render in the row-preview table — from the applied template
  // when one's in use, otherwise whatever's checked in the manual mapper.
  const previewColumns: ParsedColumn[] = useMemo(() => {
    if (matchedTemplate) {
      return matchedTemplate.column_map.map((c) => ({ letter: c.letter, label: c.label }));
    }
    return columns.filter((c) => selectedColumns.has(c.letter));
  }, [matchedTemplate, columns, selectedColumns]);

  const columnIndexByLetter = useMemo(() => {
    const map = new Map<string, number>();
    columns.forEach((c, i) => map.set(c.letter, i));
    return map;
  }, [columns]);

  const applyTemplate = (template: ImportTemplate) => {
    setMatchedTemplate(template);
    setTemplateName(template.name);
    setHeaderRowIndex(template.header_row - 1);
    setSelectedColumns(new Set(template.column_map.map((c) => c.letter)));
    const roles: Record<string, ImportColumnRole> = {};
    template.column_map.forEach((c) => {
      if (c.role) roles[c.letter] = c.role;
    });
    setColumnRoles(roles);
  };

  const handleSubmit = async () => {
    if (!rawFile || !activeSheet) return;

    const form = new FormData();
    form.append("file", rawFile);
    form.append("sheet_name", activeSheet);
    form.append("production_date", dateToISO(productionDate));

    // Ordinal positions within the filtered, non-blank data rows — must
    // match how the backend filters the same file (slice past header row,
    // drop fully-blank rows), NOT raw spreadsheet row numbers.
    const selectedRowIndices = Array.from(selectedRows).sort((a, b) => a - b);
    form.append("selected_row_indices", JSON.stringify(selectedRowIndices));

    if (matchedTemplate) {
      form.append("template_id", String(matchedTemplate.id));
    } else {
      const cols = columns.filter((c) => selectedColumns.has(c.letter));
      if (cols.length === 0 || !templateName.trim()) return;
      form.append("template_name", templateName);
      form.append("header_row", String((headerRowIndex ?? 0) + 1));
      cols.forEach((c, i) => {
        form.append(`columns[${i}][letter]`, c.letter);
        form.append(`columns[${i}][label]`, c.label);
        form.append(`columns[${i}][db_column]`, slugify(c.label));
        form.append(`columns[${i}][role]`, columnRoles[c.letter] ?? "");
      });
    }

    try {
      await submit(form);
      onImported?.();
    } catch {
      // error is already captured in the store; nothing else to do here
    }
  };

  const canSubmit =
    !!rawFile &&
    !submitting &&
    selectedRows.size > 0 &&
    (matchedTemplate || (selectedColumns.size > 0 && templateName.trim().length > 0));

  return (
    <div className="space-y-4">
      {/* Upload */}
      {!rawFile && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Import from spreadsheet
            </CardTitle>
            <CardDescription>
              Upload an Excel or CSV file to sync into Production Entries.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              onClick={() => inputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-10 cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <Upload className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-medium">Click to choose a file</p>
              <p className="text-xs text-muted-foreground">.xlsx, .xls, or .csv</p>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>
            {fileError && (
              <p className="text-sm text-rose-600 mt-2">{fileError}</p>
            )}
          </CardContent>
        </Card>
      )}

      {rawFile && (
        <>
          {/* File + sheet */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground shrink-0" />
                  <CardTitle className="text-sm font-medium truncate">
                    {rawFile.name}
                  </CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={resetFile}>
                  <X className="h-3.5 w-3.5 mr-1" />
                  Start over
                </Button>
              </div>
              <div className="flex items-center gap-1 mt-3">
                <Button
                  variant={mode === "single" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("single")}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                  This sheet
                </Button>
                <Button
                  variant={mode === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("all")}
                >
                  <Layers className="h-3.5 w-3.5 mr-1.5" />
                  All sheets ({sheetNames.length})
                </Button>
              </div>
            </CardHeader>
            {mode === "single" && (
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                  Sheet
                </p>
                <Select
                  value={activeSheet ?? undefined}
                  onValueChange={(name: string) => workbook && loadSheet(workbook, name)}
                >
                  <SelectTrigger className="w-[240px]">
                    <SelectValue placeholder="Choose a sheet" />
                  </SelectTrigger>
                  <SelectContent>
                    {sheetNames.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Template picker */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                  Saved template
                </p>
                <div className="flex items-center gap-2">
                  <Select
                    value={matchedTemplate ? String(matchedTemplate.id) : undefined}
                    onValueChange={(id: string) => {
                      const t = templates.find((t) => String(t.id) === id);
                      if (t) applyTemplate(t);
                    }}
                  >
                    <SelectTrigger className="w-[280px]">
                      <SelectValue
                        placeholder={
                          loadingTemplates ? "Loading templates…" : "Pick a template (optional)"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.name} · {t.column_map.length} columns
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {matchedTemplate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setMatchedTemplate(null);
                        setSelectedColumns(new Set());
                        setColumnRoles({});
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {/* Header row (manual mapping only) — Excel-style grid preview */}
              {!matchedTemplate && rawRows.length > 0 && (
                <div>
                  <div className="flex items-start justify-between mb-1.5">
                    <div>
                      <p className="text-xs font-medium">
                        Which row are your headers on?
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 max-w-md">
                        Click the row with your actual column names — everything above it is
                        treated as a title block and skipped.
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 whitespace-nowrap">
                      Suggested: row {suggestedHeaderRow + 1}
                    </Badge>
                  </div>

                  <div className="rounded-lg border overflow-auto max-h-80 mt-2">
                    <table className="text-xs border-collapse w-full">
                      <thead className="sticky top-0 z-10">
                        <tr>
                          <th className="sticky left-0 z-20 bg-muted border-b border-r w-10 min-w-10" />
                          {Array.from(
                            {
                              length: Math.min(
                                rawRows[0]?.length ?? 0,
                                GRID_PREVIEW_COLS,
                              ),
                            },
                            (_, i) => (
                              <th
                                key={i}
                                className="bg-muted border-b px-2 py-1 font-medium text-muted-foreground whitespace-nowrap min-w-[88px]"
                              >
                                {XLSX.utils.encode_col(i)}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {(showAllGridRows
                          ? rawRows
                          : rawRows.slice(0, GRID_PREVIEW_ROWS)
                        ).map((row, rIdx) => (
                          <tr
                            key={rIdx}
                            onClick={() => setHeaderRowIndex(rIdx)}
                            className={`cursor-pointer transition-colors ${
                              rIdx === headerRowIndex
                                ? "bg-primary/10"
                                : rIdx === suggestedHeaderRow
                                  ? "bg-amber-50"
                                  : "hover:bg-muted/50"
                            }`}
                          >
                            <td
                              className={`sticky left-0 z-10 border-r border-b px-2 py-1 text-center font-medium tabular-nums ${
                                rIdx === headerRowIndex
                                  ? "bg-primary/15 text-primary"
                                  : rIdx === suggestedHeaderRow
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {rIdx + 1}
                            </td>
                            {row.slice(0, GRID_PREVIEW_COLS).map((cell, cIdx) => (
                              <td
                                key={cIdx}
                                className={`border-b px-2 py-1 whitespace-nowrap max-w-[160px] overflow-hidden text-ellipsis ${
                                  looksNumeric(cell) ? "text-right tabular-nums" : ""
                                }`}
                                title={String(cell)}
                              >
                                {String(cell)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {rawRows.length > GRID_PREVIEW_ROWS && (
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-xs text-muted-foreground">
                        {showAllGridRows
                          ? `Showing all ${rawRows.length} rows.`
                          : `Showing the first ${GRID_PREVIEW_ROWS} of ${rawRows.length} rows.`}
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={() => setShowAllGridRows((v) => !v)}
                      >
                        {showAllGridRows
                          ? "Show fewer rows"
                          : `Show all ${rawRows.length} rows`}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            )}
          </Card>

          {mode === "single" && (
            <>
          {/* Column mapping (manual only) */}
          {!matchedTemplate && columns.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Map columns
                </CardTitle>
                <CardDescription>
                  Choose which columns to bring in, and what each one means.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Column</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {columns.map((col) => {
                      const checked = selectedColumns.has(col.letter);
                      return (
                        <TableRow key={col.letter}>
                          <TableCell>
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleColumn(col.letter)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            <span className="text-muted-foreground mr-1.5 text-xs">
                              {col.letter}
                            </span>
                            {col.label}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={columnRoles[col.letter] ?? "none"}
                              onValueChange={(v: string) => setColumnRole(col.letter, v)}
                              disabled={!checked}
                            >
                              <SelectTrigger className="w-[180px] h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ROLE_OPTIONS.map((r) => (
                                  <SelectItem key={r.value} value={r.value}>
                                    {r.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {!hasProductNameRole && (
                  <p className="text-xs text-amber-600 flex items-center gap-1.5 mt-3">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    No column marked "Product name" — rows will still be logged, but nothing
                    will sync into Production Entries.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Preview & choose rows — works whether columns came from a
              template or were mapped manually, since previewColumns
              covers both cases. */}
          {previewColumns.length > 0 && dataRows.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-medium">
                      Preview &amp; choose rows
                    </CardTitle>
                    <CardDescription>
                      Untick any row you don't want to bring in. {selectedRows.size} of{" "}
                      {dataRows.length} rows selected.
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={toggleAllRows}>
                    {selectedRows.size === dataRows.length ? "Deselect all" : "Select all"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-auto max-h-72">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-9">
                          <Checkbox
                            checked={
                              selectedRows.size === dataRows.length && dataRows.length > 0
                            }
                            onCheckedChange={toggleAllRows}
                          />
                        </TableHead>
                        <TableHead className="w-12 text-center text-xs">#</TableHead>
                        {previewColumns.map((col) => (
                          <TableHead key={col.letter} className="whitespace-nowrap">
                            <span className="text-muted-foreground mr-1 text-xs">
                              {col.letter}
                            </span>
                            {col.label}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(showAllDataRows ? dataRows : dataRows.slice(0, PREVIEW_ROWS)).map(
                        (row, i) => {
                          const checked = selectedRows.has(i);
                          const actualRowNumber = (headerRowIndex ?? 0) + 1 + i + 1;
                          return (
                            <TableRow
                              key={i}
                              onClick={() => toggleRow(i)}
                              className={`cursor-pointer ${!checked ? "opacity-50" : ""}`}
                            >
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={() => toggleRow(i)}
                                />
                              </TableCell>
                              <TableCell className="text-center text-xs text-muted-foreground tabular-nums">
                                {actualRowNumber}
                              </TableCell>
                              {previewColumns.map((col) => {
                                const idx = columnIndexByLetter.get(col.letter);
                                const val = idx != null ? row[idx] : "";
                                return (
                                  <TableCell
                                    key={col.letter}
                                    className={`whitespace-nowrap ${
                                      looksNumeric(val) ? "text-right tabular-nums" : ""
                                    }`}
                                  >
                                    {String(val)}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          );
                        },
                      )}
                    </TableBody>
                  </Table>
                </div>
                {dataRows.length > PREVIEW_ROWS && (
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">
                      {showAllDataRows
                        ? `Showing all ${dataRows.length} rows`
                        : `Showing ${PREVIEW_ROWS} of ${dataRows.length} rows`}
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={() => setShowAllDataRows((v) => !v)}
                    >
                      {showAllDataRows ? "Show fewer rows" : `Show all ${dataRows.length} rows`}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Template name + production date + submit */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              {!matchedTemplate && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">
                    Template name
                  </p>
                  <Input
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g. Daily Production Tracker"
                    className="w-[280px]"
                  />
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                  Production date
                </p>
                <Popover open={calOpen} onOpenChange={setCalOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[200px] justify-start gap-2 text-left font-normal"
                    >
                      <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                      {format(productionDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={productionDate}
                      onSelect={(d) => {
                        if (d) setProductionDate(d);
                        setCalOpen(false);
                      }}
                      disabled={(d) => d > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <p className="text-xs text-muted-foreground">
                {selectedRows.size} of {dataRows.length} data row
                {dataRows.length !== 1 ? "s" : ""} selected for import.
              </p>

              {error && <p className="text-sm text-rose-600">{error}</p>}

              <Button onClick={handleSubmit} disabled={!canSubmit}>
                {submitting ? "Importing…" : "Import"}
              </Button>
            </CardContent>
          </Card>

          {/* Result */}
          {lastResult && (
            <Card className="border-emerald-200">
              <CardContent className="pt-6 space-y-2">
                <p className="text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  Imported {lastResult.imported_rows} row
                  {lastResult.imported_rows !== 1 ? "s" : ""} using template "
                  {lastResult.template.name}".
                </p>
                {lastResult.production_sync && (
                  <div className="text-sm space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {lastResult.production_sync.matched} matched
                      </Badge>
                      <Badge variant="outline">
                        {lastResult.production_sync.skipped} skipped
                      </Badge>
                    </div>
                    {lastResult.production_sync.unmatched_names.length > 0 && (
                      <details>
                        <summary className="text-xs text-muted-foreground cursor-pointer">
                          {lastResult.production_sync.unmatched_names.length} row label
                          {lastResult.production_sync.unmatched_names.length !== 1 ? "s" : ""} did
                          not match any existing product
                        </summary>
                        <ul className="text-xs text-muted-foreground mt-1 pl-4 list-disc">
                          {lastResult.production_sync.unmatched_names.map((name) => (
                            <li key={name}>{name}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
            </>
          )}

          {/* Import selected sheets mode */}
          {mode === "all" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Import selected sheets
                </CardTitle>
                <CardDescription>
                  Each sheet is matched against your saved templates by header labels. Untick any
                  sheet you don't want to bring in, and check the date guessed from each tab name
                  before importing — dates are guessed from the sheet name and may need
                  correcting.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {scanningAll ? (
                  <p className="text-sm text-muted-foreground">Scanning sheets…</p>
                ) : sheetMatches.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sheets found.</p>
                ) : (
                  <div className="rounded-lg border overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-10">
                            <Checkbox
                              checked={
                                includedSheetCount === matchableSheetCount &&
                                matchableSheetCount > 0
                              }
                              disabled={matchableSheetCount === 0}
                              onCheckedChange={toggleAllSheetMatches}
                            />
                          </TableHead>
                          <TableHead>Sheet</TableHead>
                          <TableHead>Matched template</TableHead>
                          <TableHead>Production date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sheetMatches.map((m) => (
                          <TableRow key={m.sheetName}>
                            <TableCell>
                              <Checkbox
                                checked={m.include}
                                disabled={!m.template}
                                onCheckedChange={() => toggleSheetMatchInclude(m.sheetName)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{m.sheetName}</TableCell>
                            <TableCell>
                              {m.template ? (
                                <Badge variant="secondary">{m.template.name}</Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  No matching template — skipped
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="date"
                                value={m.date}
                                disabled={!m.template}
                                onChange={(e) =>
                                  updateSheetMatchDate(m.sheetName, e.target.value)
                                }
                                className="w-[150px] h-8"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {includedSheetCount} of {sheetMatches.length} sheets selected for import.
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleAllSheetMatches}
                      disabled={matchableSheetCount === 0}
                    >
                      {includedSheetCount === matchableSheetCount && matchableSheetCount > 0
                        ? "Deselect all"
                        : "Select all"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={scanAllSheets}>
                      Re-scan
                    </Button>
                    <Button
                      size="sm"
                      onClick={submitAllSheets}
                      disabled={batchSubmitting || includedSheetCount === 0}
                    >
                      {batchSubmitting ? "Importing…" : `Import ${includedSheetCount || ""} sheet${includedSheetCount !== 1 ? "s" : ""}`}
                    </Button>
                  </div>
                </div>

                {batchResults.length > 0 && (
                  <div className="rounded-lg border divide-y">
                    {batchResults.map((r) => (
                      <div
                        key={r.sheetName}
                        className="flex items-start gap-2 px-3 py-2 text-sm"
                      >
                        {r.status === "success" && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        )}
                        {r.status === "error" && (
                          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                        )}
                        {r.status === "skipped" && (
                          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium">{r.sheetName}</p>
                          <p className="text-xs text-muted-foreground">{r.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}