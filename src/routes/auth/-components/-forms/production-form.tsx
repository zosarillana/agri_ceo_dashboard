"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  CheckCircle2,
  XCircle,
  Loader2,
  Lock,
  Pencil,
  X,
  CalendarIcon,
} from "lucide-react";
import { productionService } from "@/services/production.service";
import {
  DailyProductionFormProps,
  ProductionEntry,
} from "@/types/production.types";
import { Product } from "@/types/products.types";

type FormRow = { actual: string; target: string; isReadOnly: boolean };
type FormState = Record<number, FormRow>;

// ── helpers ───────────────────────────────────────────────────────────────────

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

function emptyForm(products: Product[]): FormState {
  return Object.fromEntries(
    products.map((p) => [
      p.id,
      {
        actual:     "",
        target:     p.default_target?.toString() ?? "",
        isReadOnly: false,
      },
    ]),
  );
}

function populateForm(
  products: Product[],
  entries: ProductionEntry[],
): FormState {
  const entriesMap = new Map(entries.map((e) => [e.product_id, e]));

  return Object.fromEntries(
    products.map((p) => {
      const entry = entriesMap.get(p.id);
      const hasActual =
        entry && entry.actual_output != null && entry.actual_output > 0;

      return [
        p.id,
        {
          actual:     hasActual ? String(entry.actual_output) : "",
          target:     entry?.target_output != null
            ? String(entry.target_output)
            : (p.default_target?.toString() ?? ""),
          isReadOnly: !!hasActual,
        },
      ];
    }),
  );
}

// ── skeleton ──────────────────────────────────────────────────────────────────

function InputSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── banners ───────────────────────────────────────────────────────────────────

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

// ── component ─────────────────────────────────────────────────────────────────

export default function DailyProductionForm({
  products,
  entries,
  onSave,
  initialDate,
}: DailyProductionFormProps) {
  const today = getTodayISO();

  const [dateISO, setDateISO]               = useState(initialDate ?? today);
  const [calOpen, setCalOpen]               = useState(false);
  const [activeEntries, setActiveEntries]   = useState<ProductionEntry[]>(entries);
  const [fetchingEntries, setFetchingEntries] = useState(false);
  const [form, setForm]                     = useState<FormState>(() => populateForm(products, entries));
  const [isFormReadOnly, setIsFormReadOnly] = useState(false);
  const [unlockedIds, setUnlockedIds]       = useState<Set<number>>(new Set());
  const [status, setStatus]                 = useState<"idle" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg]           = useState("");
  const [isSaving, setIsSaving]             = useState(false);

  const cache = useRef<Record<string, ProductionEntry[]>>({ [today]: entries });

  // ── sync when parent entries change ──────────────────────────────────────

  useEffect(() => {
    if (initialDate && initialDate !== dateISO) {
      handleDateChange(initialDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDate]);

  useEffect(() => {
    cache.current[today] = entries;
    if (dateISO === today) {
      setActiveEntries(entries);
      setForm(populateForm(products, entries));
      setUnlockedIds(new Set());
      setIsFormReadOnly(allSaved(products, entries));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries]);

  // ── helpers ───────────────────────────────────────────────────────────────

  function allSaved(prods: Product[], ents: ProductionEntry[]) {
    return prods.every((p) => {
      const e = ents.find((en) => en.product_id === p.id);
      return e && e.actual_output != null && e.actual_output > 0;
    });
  }

  // ── unlock / relock ───────────────────────────────────────────────────────

  function unlockProduct(productId: number) {
    setUnlockedIds((prev) => new Set(prev).add(productId));
    setForm((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], isReadOnly: false },
    }));
    setStatus("idle");
    setStatusMsg("");
  }

  function relockProduct(productId: number) {
    setUnlockedIds((prev) => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });

    const entry   = activeEntries.find((e) => e.product_id === productId);
    const product = products.find((p) => p.id === productId);

    setForm((prev) => ({
      ...prev,
      [productId]: {
        actual: entry?.actual_output != null ? String(entry.actual_output) : "",
        target: entry?.target_output != null
          ? String(entry.target_output)
          : (product?.default_target?.toString() ?? ""),
        isReadOnly: true,
      },
    }));
    setStatus("idle");
    setStatusMsg("");
  }

  // ── date change ───────────────────────────────────────────────────────────

  async function handleDateChange(newISO: string) {
    setDateISO(newISO);
    setCalOpen(false);
    setStatus("idle");
    setStatusMsg("");
    setUnlockedIds(new Set());

    if (cache.current[newISO] !== undefined) {
      const cached = cache.current[newISO];
      setActiveEntries(cached);
      setForm(populateForm(products, cached));
      setIsFormReadOnly(allSaved(products, cached));
      return;
    }

    setFetchingEntries(true);
    try {
      const data = await productionService.getByDate(newISO);
      cache.current[newISO] = data;
      setActiveEntries(data);
      setForm(populateForm(products, data));
      setIsFormReadOnly(allSaved(products, data));
    } catch (err) {
      console.error("Date fetch error:", err);
      cache.current[newISO] = [];
      setActiveEntries([]);
      setForm(emptyForm(products));
      setIsFormReadOnly(false);
    } finally {
      setFetchingEntries(false);
    }
  }

  // ── form editing ──────────────────────────────────────────────────────────

  function handleChange(
    productId: number,
    field: "actual" | "target",
    value: string,
  ) {
    if (form[productId]?.isReadOnly) return;
    setForm((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], [field]: value },
    }));
    setStatus("idle");
  }

  function handleReset() {
    setForm(populateForm(products, activeEntries));
    setUnlockedIds(new Set());
    setStatus("idle");
    setStatusMsg("");
  }

  // ── save ──────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    const entriesToSave = products
      .filter((p) => !form[p.id]?.isReadOnly)
      .filter((p) => form[p.id]?.actual !== "" || form[p.id]?.target !== "")
      .map((p) => ({
        id:              activeEntries.find((e) => e.product_id === p.id)?.id,
        product_id:      p.id,
        production_date: dateISO,
        actual_output:   parseFloat(form[p.id]?.actual ?? "0") || 0,
        target_output:   parseFloat(form[p.id]?.target ?? "0") || 0,
        remarks:         null,
      }));

    if (entriesToSave.length === 0) {
      setStatus("error");
      setStatusMsg(
        "Please enter at least one value, or unlock a saved entry to update it.",
      );
      return;
    }

    setIsSaving(true);
    try {
      const saved = await productionService.bulkCreate(entriesToSave);

      const merged = [
        ...activeEntries.filter(
          (e) => !entriesToSave.some((s) => s.product_id === e.product_id),
        ),
        ...saved,
      ];

      cache.current[dateISO] = merged;
      setActiveEntries(merged);
      setForm(populateForm(products, merged));
      setUnlockedIds(new Set());
      setIsFormReadOnly(allSaved(products, merged));

      const isUpdate = entriesToSave.some((e) => e.id != null);
      setStatus("success");
      setStatusMsg(
        `Entries ${isUpdate ? "updated" : "saved"} for ${format(isoToDate(dateISO), "PPP")}.`,
      );

      if (dateISO === today) onSave?.();
    } catch (err) {
      console.error("Save error:", err);
      setStatus("error");
      setStatusMsg("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  // ── render ────────────────────────────────────────────────────────────────

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No products yet. Add some in the Products tab.
        </CardContent>
      </Card>
    );
  }

  const selectedDate        = isoToDate(dateISO);
  const hasAnyEditableRow   = products.some((p) => !form[p.id]?.isReadOnly);
  const hasUnlockedRows     = unlockedIds.size > 0;
  const showActionButtons   = hasAnyEditableRow && !fetchingEntries;

  return (
    <div className="space-y-4">

      {/* ── Date picker ───────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Daily Production Entry
          </CardTitle>
          <CardDescription>
            Enter actual output and targets for each product line
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 flex-wrap">
            <Label className="text-sm whitespace-nowrap">Date</Label>

            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={fetchingEntries || isSaving}
                  className="w-[200px] justify-start gap-2 text-left font-normal"
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

            {/* All saved hint */}
            {isFormReadOnly && !fetchingEntries && unlockedIds.size === 0 && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3 shrink-0" />
                All entries saved — click{" "}
                <Pencil className="h-3 w-3 inline mx-0.5" /> to edit a product
              </span>
            )}

            {/* Unlocked hint */}
            {hasUnlockedRows && (
              <span className="flex items-center gap-1.5 text-xs text-amber-600">
                <Pencil className="h-3 w-3 shrink-0" />
                {unlockedIds.size} product{unlockedIds.size === 1 ? "" : "s"} unlocked for editing
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Status banners (above the grid) ──────── */}
      {status === "success" && <SuccessBanner message={statusMsg} />}
      {status === "error"   && <ErrorBanner   message={statusMsg} />}

      {/* ── Product tiles ─────────────────────────── */}
      {fetchingEntries ? (
        <InputSkeleton count={products.length} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {products.map((p) => {
            const row        = form[p.id];
            const isReadOnly = row?.isReadOnly ?? false;
            const isUnlocked = unlockedIds.has(p.id);
            const isEditable = !isReadOnly || isUnlocked;

            return (
              <Card
                key={p.id}
                className={
                  isReadOnly && !isUnlocked
                    ? "opacity-70"
                    : isUnlocked
                      ? "border-amber-500/50 dark:border-amber-500/30"
                      : undefined
                }
              >
                <CardContent className="pt-4 pb-4">
                  {/* Header */}
                  <div className="flex items-baseline justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{p.name}</p>
                      {isUnlocked && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 font-medium">
                          editing
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs text-muted-foreground">
                        {p.unit ?? "—"}/day
                      </p>
                      {/* Unlock / relock button — only for saved entries */}
                      {(isReadOnly || isUnlocked) && (
                        isUnlocked ? (
                          <button
                            onClick={() => relockProduct(p.id)}
                            disabled={isSaving}
                            className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                            aria-label="Cancel edit"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => unlockProduct(p.id)}
                            disabled={isSaving}
                            className="p-0.5 rounded text-muted-foreground hover:text-amber-600 transition-colors disabled:opacity-50"
                            aria-label="Edit entry"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Inputs */}
                  <div className="grid grid-cols-2 gap-3">
                    {(["actual", "target"] as const).map((field) => (
                      <div key={field} className="space-y-1">
                        <Label
                          htmlFor={`${p.id}-${field}`}
                          className="text-xs text-muted-foreground capitalize"
                        >
                          {field === "actual" ? "Actual output" : "Target"}
                        </Label>
                        <Input
                          id={`${p.id}-${field}`}
                          type="number"
                          min={0}
                          step={1}
                          placeholder={
                            field === "target" && !isEditable
                              ? "Default target"
                              : "0"
                          }
                          readOnly={!isEditable}
                          disabled={isSaving || !isEditable}
                          value={row?.[field] ?? ""}
                          onChange={(e) => handleChange(p.id, field, e.target.value)}
                          className={
                            !isEditable
                              ? "bg-muted cursor-default pointer-events-none"
                              : undefined
                          }
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Actions ───────────────────────────────── */}
      {showActionButtons && (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isSaving}
          >
            Reset
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isSaving
              ? "Saving…"
              : hasUnlockedRows
                ? `Update ${unlockedIds.size} entr${unlockedIds.size === 1 ? "y" : "ies"}`
                : "Save entry"}
          </Button>
        </div>
      )}
    </div>
  );
}