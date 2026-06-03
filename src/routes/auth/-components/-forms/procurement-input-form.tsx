"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  CalendarIcon,
  Loader2,
  Save,
  Lock,
  Pencil,
  CheckCircle2,
  XCircle,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { procurementService } from "@/services/procurement.service";
import { useProcurementStore } from "@/store/procurement.store";
import {
  ProcurementRecord,
  ProcurementStatus,
  CreateProcurementDTO,
} from "@/types/procurement.types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProcurementRow {
  id?: number;
  itemName: string;
  supplier: string;
  quantity: string;
  unit: string;
  status: ProcurementStatus;
  isReadOnly: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayISO() {
  return new Date().toLocaleDateString("en-CA");
}

function isoToDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function recordToRow(r: ProcurementRecord): ProcurementRow {
  return {
    id:         r.id,
    itemName:   r.item_name,
    supplier:   r.supplier ?? "",
    quantity:   String(r.quantity),
    unit:       r.unit,
    status:     r.status,
    isReadOnly: true,
  };
}

function emptyRow(): ProcurementRow {
  return {
    itemName:   "",
    supplier:   "",
    quantity:   "",
    unit:       "",
    status:     "pending",
    isReadOnly: false,
  };
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

function InputSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-4 pb-4 space-y-3">
            <div className="flex items-baseline justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-12" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-9 w-full rounded-md" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-9 w-full rounded-md" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProcurementInputForm({
  onSaved,
}: {
  onSaved: () => void;
}) {
  const { fetchLatest } = useProcurementStore();

  const [dateISO, setDateISO]                   = React.useState<string>(getTodayISO());
  const [calOpen, setCalOpen]                   = React.useState<boolean>(false);
  const [rows, setRows]                         = React.useState<ProcurementRow[]>([emptyRow()]);
  const [fetching, setFetching]                 = React.useState<boolean>(false);
  const [isSaving, setIsSaving]                 = React.useState<boolean>(false);
  const [unlockedIdxs, setUnlockedIdxs]         = React.useState<Set<number>>(new Set());
  const [submissionStatus, setSubmissionStatus] = React.useState<"idle" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg]               = React.useState<string>("");

  const cache = React.useRef<Record<string, ProcurementRecord[]>>({});

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchForDate = React.useCallback(async (iso: string) => {
    if (cache.current[iso] !== undefined) {
      applyData(cache.current[iso]);
      return;
    }
    setFetching(true);
    try {
      const response = await procurementService.getAll(iso, iso);
      // API returns { data: ProcurementRecord[] } wrapped by axios,
      // so the actual array lives at response.data.data
      const records: ProcurementRecord[] =
        Array.isArray(response.data)
          ? response.data
          : (response.data as any)?.data ?? [];
      cache.current[iso] = records;
      applyData(records);
    } catch {
      cache.current[iso] = [];
      applyData([]);
    } finally {
      setFetching(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyData(records: ProcurementRecord[]) {
    setRows(records.length > 0 ? records.map(recordToRow) : [emptyRow()]);
    setUnlockedIdxs(new Set());
    setSubmissionStatus("idle");
    setStatusMsg("");
  }

  React.useEffect(() => {
    fetchForDate(getTodayISO());
  }, [fetchForDate]);

  // ── Date change ────────────────────────────────────────────────────────────

  async function handleDateChange(d: Date | undefined) {
    if (!d) return;
    const iso = d.toLocaleDateString("en-CA");
    setDateISO(iso);
    setCalOpen(false);
    setSubmissionStatus("idle");
    setStatusMsg("");
    await fetchForDate(iso);
  }

  // ── Row helpers ────────────────────────────────────────────────────────────

  function updateRow(
    idx: number,
    patch: Partial<Omit<ProcurementRow, "isReadOnly" | "id">>,
  ) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
    setSubmissionStatus("idle");
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
    setUnlockedIdxs((prev) => {
      const next = new Set<number>();
      prev.forEach((i) => {
        if (i < idx) next.add(i);
        else if (i > idx) next.add(i - 1);
      });
      return next;
    });
  }

  // ── Unlock / Relock ────────────────────────────────────────────────────────

  function unlockRow(idx: number) {
    setUnlockedIdxs((prev) => new Set(prev).add(idx));
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, isReadOnly: false } : r)),
    );
    setSubmissionStatus("idle");
    setStatusMsg("");
  }

  function relockRow(idx: number) {
    setUnlockedIdxs((prev) => {
      const next = new Set(prev);
      next.delete(idx);
      return next;
    });
    const cached   = cache.current[dateISO] ?? [];
    const original = cached[idx];
    setRows((prev) =>
      prev.map((r, i) =>
        i === idx ? (original ? recordToRow(original) : emptyRow()) : r,
      ),
    );
    setSubmissionStatus("idle");
    setStatusMsg("");
  }

  function handleReset() {
    applyData(cache.current[dateISO] ?? []);
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const rowsToSave = rows.filter((r, idx) => {
      if (unlockedIdxs.has(idx)) return true;
      if (!r.isReadOnly && r.itemName.trim()) return true;
      return false;
    });

    if (rowsToSave.length === 0) {
      setSubmissionStatus("error");
      setStatusMsg(
        "Please fill in at least one item, or unlock a saved entry to update it.",
      );
      return;
    }

    const payload: CreateProcurementDTO[] = rowsToSave.map((r) => ({
      item_name: r.itemName,
      supplier:  r.supplier || null,
      status:    r.status,
      quantity:  parseFloat(r.quantity.replace(/,/g, "")) || 0,
      unit:      r.unit,
    }));

    setIsSaving(true);
    try {
      await procurementService.storeBulk(payload, dateISO);

      delete cache.current[dateISO];
      await fetchForDate(dateISO);
      setUnlockedIdxs(new Set());

      const wasUpdate = unlockedIdxs.size > 0;
      setSubmissionStatus("success");
      setStatusMsg(
        `Procurement record${rowsToSave.length > 1 ? "s" : ""} ${wasUpdate ? "updated" : "saved"} for ${format(isoToDate(dateISO), "PPP")}.`,
      );
      fetchLatest();
      onSaved();
    } catch (err: any) {
      setSubmissionStatus("error");
      setStatusMsg(
        err?.response?.data?.message ?? "Something went wrong. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const selectedDate    = isoToDate(dateISO);
  const allReadOnly     = rows.length > 0 && rows.every((r) => r.isReadOnly) && unlockedIdxs.size === 0;
  const hasEditableRows = rows.some((r, idx) => !r.isReadOnly || unlockedIdxs.has(idx));
  const showActions     = hasEditableRows && !fetching;
  const hasNewRows      = rows.some((r) => !r.isReadOnly);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* Date picker card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Procurement Entry</CardTitle>
          <CardDescription>Select the date for this procurement record</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 flex-wrap">
            <Label className="text-sm whitespace-nowrap">Entry Date</Label>

            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={fetching || isSaving}
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
                  onSelect={handleDateChange}
                  disabled={(d) => d > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {allReadOnly && !fetching && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3 shrink-0" />
                All records saved — click <Pencil className="h-3 w-3 inline mx-0.5" /> to update
              </span>
            )}

            {unlockedIdxs.size > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-amber-600">
                <Pencil className="h-3 w-3 shrink-0" />
                {unlockedIdxs.size} record{unlockedIdxs.size === 1 ? "" : "s"} unlocked for editing
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Banners */}
      {submissionStatus === "success" && <SuccessBanner message={statusMsg} />}
      {submissionStatus === "error"   && <ErrorBanner   message={statusMsg} />}

      {/* Row tiles */}
      {fetching ? (
        <InputSkeleton />
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-3">
            {rows.map((row, idx) => {
              const isUnlocked = unlockedIdxs.has(idx);
              const isEditable = !row.isReadOnly || isUnlocked;

              return (
                <Card
                  key={idx}
                  className={
                    row.isReadOnly && !isUnlocked
                      ? "opacity-70"
                      : isUnlocked
                        ? "border-amber-500/50 dark:border-amber-500/30"
                        : undefined
                  }
                >
                  <CardContent className="pt-4 pb-4 space-y-3">

                    {/* Row header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {rows.length > 1 ? `Item ${idx + 1}` : "Item Details"}
                        </p>
                        {isUnlocked && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 font-medium">
                            editing
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {/* Unlock / relock for saved rows */}
                        {(row.isReadOnly || isUnlocked) && (
                          isUnlocked ? (
                            <button
                              type="button"
                              onClick={() => relockRow(idx)}
                              disabled={isSaving}
                              className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                              aria-label="Cancel edit"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => unlockRow(idx)}
                              disabled={isSaving}
                              className="p-0.5 rounded text-muted-foreground hover:text-amber-600 transition-colors disabled:opacity-50"
                              aria-label="Edit record"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )
                        )}
                        {/* Remove button for new unsaved rows (not the only row) */}
                        {!row.isReadOnly && !isUnlocked && rows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRow(idx)}
                            disabled={isSaving}
                            className="p-0.5 rounded text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50"
                            aria-label="Remove row"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Item Name</p>
                        <Input
                          placeholder="e.g. Raw coconuts"
                          required
                          value={row.itemName}
                          onChange={(e) => updateRow(idx, { itemName: e.target.value })}
                          readOnly={!isEditable}
                          disabled={isSaving}
                          className={cn(
                            "h-9 text-sm",
                            !isEditable && "bg-muted cursor-default pointer-events-none",
                          )}
                        />
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Supplier</p>
                        <Input
                          placeholder="e.g. AgriSupply Co."
                          value={row.supplier}
                          onChange={(e) => updateRow(idx, { supplier: e.target.value })}
                          readOnly={!isEditable}
                          disabled={isSaving}
                          className={cn(
                            "h-9 text-sm",
                            !isEditable && "bg-muted cursor-default pointer-events-none",
                          )}
                        />
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Quantity</p>
                        <Input
                          type="text"
                          placeholder="0.00"
                          required
                          value={row.quantity}
                          onChange={(e) => updateRow(idx, { quantity: e.target.value })}
                          readOnly={!isEditable}
                          disabled={isSaving}
                          className={cn(
                            "h-9 text-sm",
                            !isEditable && "bg-muted cursor-default pointer-events-none",
                          )}
                        />
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Unit</p>
                        <Input
                          placeholder="e.g. Kg, Ltrs, Units"
                          required
                          value={row.unit}
                          onChange={(e) => updateRow(idx, { unit: e.target.value })}
                          readOnly={!isEditable}
                          disabled={isSaving}
                          className={cn(
                            "h-9 text-sm",
                            !isEditable && "bg-muted cursor-default pointer-events-none",
                          )}
                        />
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <p className="text-xs text-muted-foreground">Status</p>
                        <Select
                          value={row.status}
                          onValueChange={(v) =>
                            isEditable && updateRow(idx, { status: v as ProcurementStatus })
                          }
                          disabled={!isEditable || isSaving}
                        >
                          <SelectTrigger
                            className={cn(
                              "h-9 text-sm",
                              !isEditable && "bg-muted cursor-default",
                            )}
                          >
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="received">Received</SelectItem>
                            <SelectItem value="delayed">Delayed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                  </CardContent>
                </Card>
              );
            })}

            {/* Add row — only shown when there are new unsaved rows */}
            {hasNewRows && (
              <button
                type="button"
                onClick={addRow}
                disabled={isSaving}
                className="w-full py-2 rounded-md border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors disabled:opacity-50"
              >
                + Add another item
              </button>
            )}
          </div>

          {showActions && (
            <div className="flex items-center gap-3 mt-4">
              <Button type="submit" disabled={isSaving} className="flex-1">
                {isSaving ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
                ) : unlockedIdxs.size > 0 ? (
                  `Update ${unlockedIdxs.size} record${unlockedIdxs.size === 1 ? "" : "s"}`
                ) : (
                  <><Save className="h-4 w-4 mr-2" />Save Records</>
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