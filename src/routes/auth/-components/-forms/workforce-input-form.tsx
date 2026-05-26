// src/components/-forms/workforce-input-form.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import {
  CalendarIcon,
  Lock,
  Pencil,
  X,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { workforceService } from "@/services/workforce.service";
import { useWorkforceStore } from "@/store/workforce.store";
import { WorkforceRecord, WorkforceRowPayload } from "@/types/workforce.types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DeptRow {
  key: string;
  label: string;
  present: string;
  headcount: string;
  incidents: string;
  isReadOnly: boolean;
}

interface Section {
  heading: string;
  rows: DeptRow[];
}

interface WorkforceInputFormProps {
  onSaved?: () => void;
}

// ─── Department config ────────────────────────────────────────────────────────

const DEPT_SECTIONS: { heading: string; keys: string[] }[] = [
  {
    heading: "DEPARTMENT",
    keys: [
      "hr",
      "it",
      "sales",
      "finance",
      "gen_ops",
      "proc_rm",
      "proc_nrm",
      "proc_local_sales",
      "project",
      "field_ops",
      "business_ops",
      "engineering",
    ],
  },
  {
    heading: "DIRECT COST",
    keys: [
      "proc_nuts_receiving",
      "prod_dry_process",
      "prod_liquid_line",
      "quality",
    ],
  },
];

const DEPT_LABELS: Record<string, string> = {
  //   opex: "OPEX",
  hr: "HR",
  it: "IT",
  sales: "Sales",
  finance: "Finance",
  gen_ops: "Gen Ops",
  proc_rm: "Procurement - RM",
  proc_nrm: "Procurement - NRM",
  proc_local_sales: "Procurement - Local Sales",
  project: "Project",
  field_ops: "Field Operations",
  business_ops: "Business Ops",
  engineering: "Engineering",
  proc_nuts_receiving: "Procurement - Nuts Receiving",
  prod_dry_process: "Production - Dry Process",
  prod_liquid_line: "Production - Liquid Line",
  quality: "Quality",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayISO() {
  return new Date().toLocaleDateString("en-CA");
}

function dateToISO(d: Date) {
  return d.toLocaleDateString("en-CA");
}

function isoToDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toNum(v: string) {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function attendanceRate(present: string, headcount: string) {
  const p = toNum(present);
  const h = toNum(headcount);
  if (h === 0) return null;
  return Math.round((p / h) * 100);
}

function rateBadgeVariant(rate: number) {
  if (rate >= 90) return "default" as const;
  if (rate >= 75) return "outline" as const;
  return "destructive" as const;
}

function buildEmptySections(): Section[] {
  return DEPT_SECTIONS.map(({ heading, keys }) => ({
    heading,
    rows: keys.map((key) => ({
      key,
      label: DEPT_LABELS[key],
      present: "",
      headcount: "",
      incidents: "",
      isReadOnly: false,
    })),
  }));
}

function populateSections(records: WorkforceRecord[]): Section[] {
  const recordMap = new Map(records.map((r) => [r.department_key, r]));
  return DEPT_SECTIONS.map(({ heading, keys }) => ({
    heading,
    rows: keys.map((key) => {
      const existing = recordMap.get(key);
      const hasData =
        existing && (existing.present > 0 || existing.headcount > 0);
      return {
        key,
        label: DEPT_LABELS[key],
        present: existing ? String(existing.present) : "",
        headcount: existing ? String(existing.headcount) : "",
        incidents: existing ? String(existing.incidents) : "",
        isReadOnly: !!hasData,
      };
    }),
  }));
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function InputSkeleton() {
  return (
    <Card>
      <CardContent className="pt-4 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WorkforceInputForm({
  onSaved,
}: WorkforceInputFormProps) {
  const { saveRecords } = useWorkforceStore();

  const [dateISO, setDateISO] = useState(getTodayISO);
  const [calOpen, setCalOpen] = useState(false);
  const [sections, setSections] = useState<Section[]>(buildEmptySections);
  const [fetchingRows, setFetchingRows] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [unlockedKeys, setUnlockedKeys] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [isAllReadOnly, setIsAllReadOnly] = useState(false);

  const cache = useRef<Record<string, WorkforceRecord[]>>({});

  // ── Initial fetch ───────────────────────────────────────────────────────────
  useEffect(() => {
    fetchForDate(getTodayISO());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Date fetch ──────────────────────────────────────────────────────────────

  async function fetchForDate(iso: string) {
    if (cache.current[iso] !== undefined) {
      applySections(cache.current[iso]);
      return;
    }

    setFetchingRows(true);
    try {
      const { data } = await workforceService.getLatest(iso, iso);
      cache.current[iso] = data;
      applySections(data);
    } catch {
      cache.current[iso] = [];
      setSections(buildEmptySections());
      setIsAllReadOnly(false);
      setUnlockedKeys(new Set());
    } finally {
      setFetchingRows(false);
    }
  }

  function applySections(records: WorkforceRecord[]) {
    const populated = populateSections(records);
    setSections(populated);
    const allReadOnly = populated.every((sec) =>
      sec.rows.every((r) => r.isReadOnly),
    );
    setIsAllReadOnly(allReadOnly);
    setUnlockedKeys(new Set());
  }

  async function handleDateChange(iso: string) {
    setDateISO(iso);
    setCalOpen(false);
    setStatus("idle");
    setStatusMsg("");
    await fetchForDate(iso);
  }

  // ── Row updater ─────────────────────────────────────────────────────────────

  function updateRow(
    sectionIdx: number,
    rowIdx: number,
    field: "present" | "headcount" | "incidents",
    value: string,
  ) {
    setStatus("idle");
    setSections((prev) =>
      prev.map((sec, si) =>
        si !== sectionIdx
          ? sec
          : {
              ...sec,
              rows: sec.rows.map((row, ri) =>
                ri !== rowIdx ? row : { ...row, [field]: value },
              ),
            },
      ),
    );
  }

  // ── Unlock / relock ─────────────────────────────────────────────────────────

  function unlockRow(key: string) {
    setUnlockedKeys((prev) => new Set(prev).add(key));
    setSections((prev) =>
      prev.map((sec) => ({
        ...sec,
        rows: sec.rows.map((row) =>
          row.key === key ? { ...row, isReadOnly: false } : row,
        ),
      })),
    );
    setStatus("idle");
  }

  function relockRow(key: string) {
    setUnlockedKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });

    // Restore from cache
    const cached = cache.current[dateISO];
    const original = cached?.find((r) => r.department_key === key);

    setSections((prev) =>
      prev.map((sec) => ({
        ...sec,
        rows: sec.rows.map((row) => {
          if (row.key !== key) return row;
          if (original) {
            return {
              ...row,
              present: String(original.present),
              headcount: String(original.headcount),
              incidents: String(original.incidents),
              isReadOnly: true,
            };
          }
          return {
            ...row,
            present: "",
            headcount: "",
            incidents: "",
            isReadOnly: false,
          };
        }),
      })),
    );
    setStatus("idle");
  }

  function handleReset() {
    if (cache.current[dateISO]) {
      applySections(cache.current[dateISO]);
    } else {
      setSections(buildEmptySections());
    }
    setUnlockedKeys(new Set());
    setStatus("idle");
    setStatusMsg("");
  }

  // ── Derived totals ──────────────────────────────────────────────────────────

  const allRows = sections.flatMap((s) => s.rows);
  const totalPresent = allRows.reduce((sum, r) => sum + toNum(r.present), 0);
  const totalHeadcount = allRows.reduce(
    (sum, r) => sum + toNum(r.headcount),
    0,
  );
  const totalIncidents = allRows.reduce(
    (sum, r) => sum + toNum(r.incidents),
    0,
  );
  const totalRate = attendanceRate(
    String(totalPresent),
    String(totalHeadcount),
  );

  // ── Save ────────────────────────────────────────────────────────────────────

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    const rowsToSave = allRows.filter((r) => {
      if (unlockedKeys.has(r.key)) return true;
      if (!r.isReadOnly && toNum(r.headcount) > 0) return true;
      return false;
    });

    if (rowsToSave.length === 0) {
      setStatus("error");
      setStatusMsg(
        "Enter headcount for at least one department, or unlock a saved entry to update it.",
      );
      return;
    }

    const payload: WorkforceRowPayload[] = rowsToSave.map((r) => ({
      department_key: r.key,
      present: toNum(r.present),
      headcount: toNum(r.headcount),
      incidents: toNum(r.incidents),
    }));

    setIsSaving(true);
    try {
      await saveRecords(payload, dateISO);

      // Invalidate cache and re-fetch so lock state is accurate
      delete cache.current[dateISO];
      await fetchForDate(dateISO);

      setUnlockedKeys(new Set());
      setStatus("success");
      setStatusMsg(
        `Workforce records ${unlockedKeys.size > 0 ? "updated" : "saved"} for ${format(isoToDate(dateISO), "PPP")}.`,
      );
      onSaved?.();
    } catch (err: any) {
      setStatus("error");
      setStatusMsg(
        err?.response?.data?.message ??
          "Something went wrong. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  // ── Derived flags ───────────────────────────────────────────────────────────

  const hasEditableRows = allRows.some(
    (r) => !r.isReadOnly && toNum(r.headcount) > 0,
  );
  const hasUnlockedRows = unlockedKeys.size > 0;
  const showActionButtons =
    (hasEditableRows || hasUnlockedRows) && !fetchingRows;
  const selectedDate = isoToDate(dateISO);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Date picker card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Workforce Entry</CardTitle>
          <CardDescription>
            Enter attendance and safety data per department
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 flex-wrap">
            <Label className="text-sm whitespace-nowrap">Record Date</Label>

            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={fetchingRows || isSaving}
                  className="w-[240px] justify-start gap-2 text-left font-normal"
                >
                  <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  {format(selectedDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => d && handleDateChange(dateToISO(d))}
                  disabled={(d) => d > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {isAllReadOnly && !fetchingRows && unlockedKeys.size === 0 && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3 shrink-0" />
                All records saved — click{" "}
                <Pencil className="h-3 w-3 inline mx-0.5" /> to update
              </span>
            )}

            {unlockedKeys.size > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-amber-600">
                <Pencil className="h-3 w-3 shrink-0" />
                {unlockedKeys.size} row{unlockedKeys.size === 1 ? "" : "s"}{" "}
                unlocked for editing
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Banners */}
      {status === "success" && <SuccessBanner message={statusMsg} />}
      {status === "error" && <ErrorBanner message={statusMsg} />}

      {/* Table */}
      {fetchingRows ? (
        <InputSkeleton />
      ) : (
        <form onSubmit={handleSave} noValidate>
          <Card>
            <CardContent className="pt-4 pb-2">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold w-[220px]">
                      OPEX
                    </TableHead>
                    <TableHead className="text-right font-semibold w-28">
                      Present
                    </TableHead>
                    <TableHead className="text-right font-semibold w-28">
                      Headcount
                    </TableHead>
                    <TableHead className="text-right font-semibold w-28">
                      Incidents
                    </TableHead>
                    <TableHead className="text-right font-semibold w-20">
                      Rate
                    </TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {sections.map((sec, si) => (
                    <>
                      {/* Section heading */}
                      <TableRow
                        key={sec.heading}
                        className="bg-muted/60 hover:bg-muted/60"
                      >
                        <TableCell
                          colSpan={6}
                          className="py-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                        >
                          {sec.heading}
                        </TableCell>
                      </TableRow>

                      {/* Department rows */}
                      {sec.rows.map((row, ri) => {
                        const isUnlocked = unlockedKeys.has(row.key);
                        const isEditable = !row.isReadOnly || isUnlocked;
                        const wasSaved = cache.current[dateISO]?.some(
                          (r) => r.department_key === row.key,
                        );
                        const rate = attendanceRate(row.present, row.headcount);

                        return (
                          <TableRow
                            key={row.key}
                            className={cn(
                              row.isReadOnly && !isUnlocked && "opacity-60",
                              isUnlocked && "bg-amber-500/5",
                            )}
                          >
                            {/* Label */}
                            <TableCell className="text-sm py-1.5">
                              <div className="flex items-center gap-1.5">
                                {row.label}
                                {isUnlocked && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 font-medium">
                                    editing
                                  </span>
                                )}
                              </div>
                            </TableCell>

                            {/* Present */}
                            <TableCell className="text-right py-1.5">
                              <Input
                                type="number"
                                min={0}
                                value={row.present}
                                onChange={(e) =>
                                  updateRow(si, ri, "present", e.target.value)
                                }
                                placeholder="0"
                                readOnly={!isEditable}
                                disabled={isSaving}
                                className={cn(
                                  "h-8 w-24 ml-auto text-right tabular-nums",
                                  !isEditable &&
                                    "bg-muted cursor-default pointer-events-none",
                                )}
                              />
                            </TableCell>

                            {/* Headcount */}
                            <TableCell className="text-right py-1.5">
                              <Input
                                type="number"
                                min={0}
                                value={row.headcount}
                                onChange={(e) =>
                                  updateRow(si, ri, "headcount", e.target.value)
                                }
                                placeholder="0"
                                readOnly={!isEditable}
                                disabled={isSaving}
                                className={cn(
                                  "h-8 w-24 ml-auto text-right tabular-nums",
                                  !isEditable &&
                                    "bg-muted cursor-default pointer-events-none",
                                )}
                              />
                            </TableCell>

                            {/* Incidents */}
                            <TableCell className="text-right py-1.5">
                              <Input
                                type="number"
                                min={0}
                                value={row.incidents}
                                onChange={(e) =>
                                  updateRow(si, ri, "incidents", e.target.value)
                                }
                                placeholder="0"
                                readOnly={!isEditable}
                                disabled={isSaving}
                                className={cn(
                                  "h-8 w-24 ml-auto text-right tabular-nums",
                                  !isEditable &&
                                    "bg-muted cursor-default pointer-events-none",
                                )}
                              />
                            </TableCell>

                            {/* Rate */}
                            <TableCell className="text-right py-1.5">
                              {rate !== null ? (
                                <Badge variant={rateBadgeVariant(rate)}>
                                  {rate}%
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  —
                                </span>
                              )}
                            </TableCell>

                            {/* Lock / unlock */}
                            <TableCell className="py-1.5 text-center">
                              {wasSaved &&
                                (isUnlocked ? (
                                  <button
                                    type="button"
                                    onClick={() => relockRow(row.key)}
                                    disabled={isSaving}
                                    className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                                    aria-label="Cancel edit"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => unlockRow(row.key)}
                                    disabled={isSaving}
                                    className="p-0.5 rounded text-muted-foreground hover:text-amber-600 transition-colors disabled:opacity-50"
                                    aria-label="Edit entry"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                ))}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </>
                  ))}

                  {/* TOTAL row */}
                  <TableRow className="border-t-2 bg-muted/30 hover:bg-muted/30">
                    <TableCell className="font-semibold text-sm">
                      TOTAL
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {totalPresent > 0 ? totalPresent : "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {totalHeadcount > 0 ? totalHeadcount : "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {totalIncidents > 0 ? totalIncidents : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {totalRate !== null ? (
                        <Badge variant={rateBadgeVariant(totalRate)}>
                          {totalRate}%
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Save / Reset */}
          {showActionButtons && (
            <div className="flex items-center gap-3 mt-4">
              <Button type="submit" disabled={isSaving} className="flex-1">
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving…
                  </>
                ) : hasUnlockedRows ? (
                  `Update ${unlockedKeys.size} row${unlockedKeys.size === 1 ? "" : "s"}`
                ) : (
                  "Save Records"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isSaving}
              >
                Reset
              </Button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
