// src/routes/auth/-components/-forms/qc-input-form.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { CalendarIcon, FlaskConical, Save, Lock, Pencil, X, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQcStore } from "@/store/qc.store";
import { qcService } from "@/services/qc.service";
import { QcRecord } from "@/types/qc.types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QCRow {
  product_id: number;
  label: string;
  tested: string;
  passed: string;
  isReadOnly: boolean;
}

interface QCInputFormProps {
  products?: { id: number; name: string; unit?: string }[];
  loading?: boolean;
  onSaved?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayISO() {
  return new Date().toLocaleDateString("en-CA");
}

function isoToDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function dateToISO(d: Date) {
  return d.toLocaleDateString("en-CA");
}

function emptyRows(products: { id: number; name: string }[]): QCRow[] {
  return products.map((p) => ({
    product_id: p.id,
    label: p.name,
    tested: "",
    passed: "",
    isReadOnly: false,
  }));
}

function populateRows(
  products: { id: number; name: string }[],
  records: QcRecord[]
): QCRow[] {
  const map = new Map(records.map((r) => [r.product_id, r]));
  return products.map((p) => {
    const existing = map.get(p.id);
    const hasData  = existing && existing.tested > 0;
    return {
      product_id: p.id,
      label:      p.name,
      tested:     existing ? String(existing.tested) : "",
      passed:     existing ? String(existing.passed)  : "",
      isReadOnly: !!hasData,
    };
  });
}

function getRowStats(row: QCRow) {
  const tested = parseInt(row.tested);
  const passed = parseInt(row.passed);
  if (!tested || isNaN(tested) || isNaN(passed)) return null;
  if (passed > tested) return null;
  return {
    passRate:   ((passed / tested) * 100).toFixed(1),
    rejectRate: (((tested - passed) / tested) * 100).toFixed(1),
  };
}

function passRateBadgeVariant(rate: number) {
  if (rate >= 97) return "default" as const;
  if (rate >= 90) return "secondary" as const;
  return "destructive" as const;
}

// ─── Banners ──────────────────────────────────────────────────────────────────

function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
      <CheckCircle2 className="h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
      <XCircle className="h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function QCInputForm({ products = [], loading = false, onSaved }: QCInputFormProps) {
  const { saveRecords, saving } = useQcStore();

  const [dateISO, setDateISO]           = useState(getTodayISO);
  const [calOpen, setCalOpen]           = useState(false);
  const [rows, setRows]                 = useState<QCRow[]>([]);
  const [errors, setErrors]             = useState<Record<string, string>>({});
  const [fetchingRows, setFetchingRows] = useState(false);
  const [unlockedIds, setUnlockedIds]   = useState<Set<number>>(new Set());
  const [status, setStatus]             = useState<"idle" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg]       = useState("");

  // Cache fetched records per date — same pattern as SalesInputForm
  const cache = useRef<Record<string, QcRecord[]>>({});

  // ── Fetch on products load ──────────────────────────────────────────────────
  useEffect(() => {
    if (products.length === 0) return;
    fetchForDate(getTodayISO());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  // ── Fetch helpers ───────────────────────────────────────────────────────────

  async function fetchForDate(iso: string) {
    if (cache.current[iso] !== undefined) {
      applyRows(products, cache.current[iso]);
      return;
    }
    setFetchingRows(true);
    try {
      const response = await qcService.getLatest(iso, iso);
      cache.current[iso] = response.data;
      applyRows(products, response.data);
    } catch {
      cache.current[iso] = [];
      setRows(emptyRows(products));
      setUnlockedIds(new Set());
    } finally {
      setFetchingRows(false);
    }
  }

  function applyRows(prods: { id: number; name: string }[], records: QcRecord[]) {
    setRows(populateRows(prods, records));
    setUnlockedIds(new Set());
    setErrors({});
  }

  async function handleDateChange(date: Date | undefined) {
    if (!date) return;
    const iso = dateToISO(date);
    setDateISO(iso);
    setCalOpen(false);
    setStatus("idle");
    setStatusMsg("");
    await fetchForDate(iso);
  }

  // ── Unlock / relock ─────────────────────────────────────────────────────────

  function unlockRow(productId: number) {
    setUnlockedIds((prev) => new Set(prev).add(productId));
    setRows((prev) =>
      prev.map((r) => r.product_id === productId ? { ...r, isReadOnly: false } : r)
    );
    setStatus("idle");
  }

  function relockRow(productId: number) {
    setUnlockedIds((prev) => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
    // Restore from cache
    const cached = cache.current[dateISO];
    if (cached) {
      const original = cached.find((r) => r.product_id === productId);
      setRows((prev) =>
        prev.map((r) => {
          if (r.product_id !== productId) return r;
          return original
            ? { ...r, tested: String(original.tested), passed: String(original.passed), isReadOnly: true }
            : { ...r, tested: "", passed: "", isReadOnly: false };
        })
      );
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`${productId}_tested`];
      delete next[`${productId}_passed`];
      delete next[`${productId}_range`];
      return next;
    });
    setStatus("idle");
  }

  // ── Field update ────────────────────────────────────────────────────────────

  function updateRow(productId: number, field: "tested" | "passed", value: string) {
    if (value !== "" && !/^\d+$/.test(value)) return;
    setRows((prev) =>
      prev.map((r) => (r.product_id === productId ? { ...r, [field]: value } : r))
    );
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`${productId}_${field}`];
      delete next[`${productId}_range`];
      return next;
    });
    setStatus("idle");
  }

  // ── Validation ──────────────────────────────────────────────────────────────

  function validate(rowsToSave: QCRow[]) {
    const errs: Record<string, string> = {};
    rowsToSave.forEach((r) => {
      const tested = parseInt(r.tested);
      const passed = parseInt(r.passed);
      if (r.tested === "" || isNaN(tested)) errs[`${r.product_id}_tested`] = "Required";
      if (r.passed === "" || isNaN(passed)) errs[`${r.product_id}_passed`] = "Required";
      if (!isNaN(tested) && !isNaN(passed) && passed > tested) {
        errs[`${r.product_id}_range`] = "Passed cannot exceed Tested";
      }
    });
    return errs;
  }

  // ── Totals ──────────────────────────────────────────────────────────────────

  const editableRows  = rows.filter((r) => !r.isReadOnly || unlockedIds.has(r.product_id));
  const totalTested   = rows.reduce((s, r) => s + (parseInt(r.tested) || 0), 0);
  const totalPassed   = rows.reduce((s, r) => s + (parseInt(r.passed) || 0), 0);
  const totalFailed   = totalTested - totalPassed;
  const overallPassRate = totalTested > 0
    ? ((totalPassed / totalTested) * 100).toFixed(1)
    : null;

  const isAllReadOnly     = rows.length > 0 && rows.every((r) => r.isReadOnly) && unlockedIds.size === 0;
  const hasEditableRows   = editableRows.length > 0;
  const showActionButtons = hasEditableRows && !fetchingRows;

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    // Determine rows to save: unlocked (update) + non-readonly with values (new)
    const rowsToSave = rows.filter((r) => {
      if (unlockedIds.has(r.product_id)) return true;
      if (!r.isReadOnly && (r.tested !== "" || r.passed !== "")) return true;
      return false;
    });

    if (rowsToSave.length === 0) {
      setStatus("error");
      setStatusMsg("Enter values for at least one product, or unlock a saved entry to update it.");
      return;
    }

    const errs = validate(rowsToSave);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const payload = rowsToSave.map((r) => ({
      product_id: r.product_id,
      tested:     parseInt(r.tested),
      passed:     parseInt(r.passed),
    }));

    try {
      await saveRecords(payload, dateISO);

      // Invalidate cache and re-fetch so read-only state refreshes
      delete cache.current[dateISO];
      await fetchForDate(dateISO);

      setStatus("success");
      setStatusMsg(
        `QC records ${unlockedIds.size > 0 ? "updated" : "saved"} for ${format(isoToDate(dateISO), "PPP")}.`
      );
      onSaved?.();
    } catch {
      setStatus("error");
      setStatusMsg("Something went wrong. Please try again.");
    }
  }

  // ── Reset ───────────────────────────────────────────────────────────────────

  function handleReset() {
    if (cache.current[dateISO]) {
      applyRows(products, cache.current[dateISO]);
    } else {
      setRows(emptyRows(products));
    }
    setErrors({});
    setStatus("idle");
    setStatusMsg("");
  }

  // ── Loading skeleton ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-[240px]" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedDate = isoToDate(dateISO);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Date picker */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Record Date</CardTitle>
          <CardDescription>Select the date for this QC entry</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 flex-wrap">
            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={fetchingRows || saving}
                  className={cn("w-[240px] justify-start text-left font-normal h-9")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateChange}
                  disabled={(d) => d > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {isAllReadOnly && !fetchingRows && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3 shrink-0" />
                All records saved — click <Pencil className="h-3 w-3 inline mx-0.5" /> to update
              </span>
            )}

            {unlockedIds.size > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-amber-600">
                <Pencil className="h-3 w-3 shrink-0" />
                {unlockedIds.size} row{unlockedIds.size === 1 ? "" : "s"} unlocked for editing
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status banners */}
      {status === "success" && <SuccessBanner message={statusMsg} />}
      {status === "error"   && <ErrorBanner   message={statusMsg} />}

      {/* QC Entry Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              QC Sample Entry
            </CardTitle>
            <CardDescription className="mt-1">
              Enter tested and passed counts per product line
            </CardDescription>
          </div>
          {overallPassRate && (
            <Badge
              variant={passRateBadgeVariant(parseFloat(overallPassRate))}
              className="text-sm px-3 py-1"
            >
              {overallPassRate}% overall
            </Badge>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          {products.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No products available. Please add products first.
            </p>
          ) : fetchingRows ? (
            <div className="space-y-2">
              {Array.from({ length: products.length || 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold w-[180px]">Product</TableHead>
                  <TableHead className="font-semibold w-[160px]">Tested</TableHead>
                  <TableHead className="font-semibold w-[160px]">Passed</TableHead>
                  <TableHead className="text-right font-semibold w-24">Pass %</TableHead>
                  <TableHead className="text-right font-semibold w-24">Reject %</TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const stats      = getRowStats(row);
                  const isUnlocked = unlockedIds.has(row.product_id);
                  const isEditable = !row.isReadOnly || isUnlocked;
                  const testedErr  = errors[`${row.product_id}_tested`];
                  const passedErr  = errors[`${row.product_id}_passed`];
                  const rangeErr   = errors[`${row.product_id}_range`];

                  return (
                    <TableRow
                      key={row.product_id}
                      className={cn(
                        row.isReadOnly && !isUnlocked && "opacity-60",
                        isUnlocked && "bg-amber-500/5"
                      )}
                    >
                      {/* Product name */}
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-1.5">
                          {row.label}
                          {isUnlocked && (
                            <span className="text-[10px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-600 font-medium">
                              editing
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Tested */}
                      <TableCell>
                        <div className="space-y-1">
                          <Input
                            value={row.tested}
                            onChange={(e) => updateRow(row.product_id, "tested", e.target.value)}
                            placeholder="0"
                            readOnly={!isEditable}
                            disabled={saving || !isEditable}
                            className={cn(
                              "h-8 w-32 tabular-nums",
                              !isEditable && "bg-muted cursor-default",
                              (testedErr || rangeErr) && "border-destructive focus-visible:ring-destructive"
                            )}
                            inputMode="numeric"
                          />
                          {testedErr && <p className="text-xs text-destructive">{testedErr}</p>}
                        </div>
                      </TableCell>

                      {/* Passed */}
                      <TableCell>
                        <div className="space-y-1">
                          <Input
                            value={row.passed}
                            onChange={(e) => updateRow(row.product_id, "passed", e.target.value)}
                            placeholder="0"
                            readOnly={!isEditable}
                            disabled={saving || !isEditable}
                            className={cn(
                              "h-8 w-32 tabular-nums",
                              !isEditable && "bg-muted cursor-default",
                              (passedErr || rangeErr) && "border-destructive focus-visible:ring-destructive"
                            )}
                            inputMode="numeric"
                          />
                          {passedErr && <p className="text-xs text-destructive">{passedErr}</p>}
                          {rangeErr  && <p className="text-xs text-destructive">{rangeErr}</p>}
                        </div>
                      </TableCell>

                      {/* Pass % */}
                      <TableCell className="text-right">
                        {stats ? (
                          <Badge
                            variant={passRateBadgeVariant(parseFloat(stats.passRate))}
                            className="text-xs tabular-nums"
                          >
                            {stats.passRate}%
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Reject % */}
                      <TableCell className="text-right">
                        {stats ? (
                          <span
                            className={`text-xs font-medium tabular-nums ${
                              parseFloat(stats.rejectRate) <= 3
                                ? "text-emerald-500"
                                : parseFloat(stats.rejectRate) <= 10
                                ? "text-amber-500"
                                : "text-rose-500"
                            }`}
                          >
                            {stats.rejectRate}%
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Lock / unlock button */}
                      <TableCell>
                        {row.isReadOnly || isUnlocked ? (
                          isUnlocked ? (
                            <button
                              type="button"
                              onClick={() => relockRow(row.product_id)}
                              disabled={saving}
                              className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                              aria-label="Cancel edit"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => unlockRow(row.product_id)}
                              disabled={saving}
                              className="p-1 rounded text-muted-foreground hover:text-amber-600 transition-colors disabled:opacity-50"
                              aria-label="Edit entry"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* Totals row */}
                <TableRow className="border-t-2 bg-muted/30 hover:bg-muted/30">
                  <TableCell className="font-semibold">Total</TableCell>
                  <TableCell className="font-semibold tabular-nums">{totalTested || "—"}</TableCell>
                  <TableCell className="font-semibold tabular-nums">{totalPassed || "—"}</TableCell>
                  <TableCell className="text-right">
                    {overallPassRate ? (
                      <Badge
                        variant={passRateBadgeVariant(parseFloat(overallPassRate))}
                        className="text-xs tabular-nums"
                      >
                        {overallPassRate}%
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {totalTested > 0 ? (
                      <span
                        className={`text-xs font-medium tabular-nums ${
                          totalFailed / totalTested <= 0.03
                            ? "text-emerald-500"
                            : totalFailed / totalTested <= 0.10
                            ? "text-amber-500"
                            : "text-rose-500"
                        }`}
                      >
                        {((totalFailed / totalTested) * 100).toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {showActionButtons && (
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 gap-2"
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
            ) : unlockedIds.size > 0 ? (
              <><Save className="h-4 w-4" /> Update {unlockedIds.size} record{unlockedIds.size === 1 ? "" : "s"}</>
            ) : (
              <><Save className="h-4 w-4" /> Save QC Records</>
            )}
          </Button>
          <Button variant="outline" onClick={handleReset} disabled={saving}>
            Reset
          </Button>
        </div>
      )}

    </div>
  );
}