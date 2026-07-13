"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, FileSpreadsheet } from "lucide-react";

import { importService } from "@/services/import.service";
import { useImportStore } from "@/store/import.store";
import { ImportRow } from "@/types/import.types";

const PER_PAGE = 25;

function parseRowData(row: ImportRow): Record<string, unknown> {
  try {
    return typeof row.data === "string" ? JSON.parse(row.data) : row.data;
  } catch {
    return {};
  }
}

function looksNumeric(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  const s = String(value).trim();
  if (s === "") return false;
  return !isNaN(Number(s.replace(/,/g, "")));
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") return value.toLocaleString();
  const s = String(value);
  const clean = s.replace(/,/g, "").trim();
  const num = parseFloat(clean);
  if (!isNaN(num) && clean !== "") return num.toLocaleString();
  return s;
}

function TableRowsSkeleton({ rows = 8, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: cols }).map((__, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full max-w-[100px]" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export default function ProductionImportViewer() {
  const { templates, fetchTemplates } = useImportStore();

  const [rows, setRows] = useState<ImportRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [templateId, setTemplateId] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (templates.length === 0) fetchTemplates();
  }, [templates.length, fetchTemplates]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await importService.getImportRows({
        page,
        per_page: PER_PAGE,
        template_id: templateId !== "all" ? templateId : undefined,
        search: search || undefined,
      });
      setRows(result.data ?? []);
      setTotal(result.total ?? 0);
      setLastPage(result.last_page ?? 1);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to load imported rows.");
    } finally {
      setLoading(false);
    }
  }, [page, templateId, search]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset to page 1 whenever a filter changes
  useEffect(() => {
    setPage(1);
  }, [templateId, search]);

  // Column order comes from the matching template's column_map when
  // available (real sheet order), falling back to first-seen key order —
  // deliberately NOT alphabetized, since that scrambles a sheet's
  // left-to-right column order into something unreadable.
  const columns = useMemo(() => {
    const ordered: string[] = [];
    const seen = new Set<string>();

    rows.forEach((row) => {
      const map = row.template?.column_map;
      if (Array.isArray(map)) {
        map.forEach((c) => {
          if (c.db_column && !seen.has(c.db_column)) {
            seen.add(c.db_column);
            ordered.push(c.db_column);
          }
        });
      }
    });

    rows.forEach((row) => {
      const data = parseRowData(row);
      Object.keys(data).forEach((key) => {
        if (!seen.has(key)) {
          seen.add(key);
          ordered.push(key);
        }
      });
    });

    // Drop columns that are empty across every visible row
    return ordered.filter((col) =>
      rows.some((row) => {
        const val = parseRowData(row)[col];
        return val !== null && val !== undefined && val !== "";
      }),
    );
  }, [rows]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-sm font-medium flex items-center gap-1.5">
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
              Imported rows
            </CardTitle>
            <CardDescription>
              Every row brought in from a spreadsheet import, for identifying source data.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="All templates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All templates</SelectItem>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sheet or file name…"
              className="w-[220px]"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}

        {!loading && rows.length === 0 && !error ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No imported rows found{search || templateId !== "all" ? " for this filter" : ""}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-14">#</TableHead>
                  <TableHead>Sheet</TableHead>
                  <TableHead>Source file</TableHead>
                  {columns.map((col) => (
                    <TableHead key={col} className="whitespace-nowrap">
                      {col}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRowsSkeleton cols={3 + columns.length} />
                ) : (
                  rows.map((row) => {
                    const data = parseRowData(row);
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="text-muted-foreground text-xs tabular-nums">
                          {row.row_number}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs">
                          {row.sheet_name}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {row.source_file ?? "—"}
                        </TableCell>
                        {columns.map((col) => {
                          const val = data[col];
                          return (
                            <TableCell
                              key={col}
                              className={`whitespace-nowrap text-sm ${
                                looksNumeric(val) ? "text-right tabular-nums" : ""
                              }`}
                              title={String(val ?? "")}
                            >
                              {formatCell(val)}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {!loading && total > PER_PAGE && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              Showing {rows.length} of {total} rows
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground">
                {page} / {lastPage}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                disabled={page === lastPage}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}