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
  CheckCircle,
  AlertCircle,
  Loader2,
  Lock,
  CalendarIcon,
} from "lucide-react";
import { productionService } from "@/services/production.service";
import { ProductionEntry } from "@/types/production.types";

// ── types ─────────────────────────────────────────────────────────────────────

interface Product {
  id: number;
  name: string;
  unit?: string | null;
  default_target?: number | null;
}

type FormRow = { actual: string; target: string; isReadOnly: boolean };
type FormState = Record<number, FormRow>;

// ── helpers ───────────────────────────────────────────────────────────────────

function getTodayISO() {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD, no tz shift
}

function dateToISO(d: Date) {
  return d.toLocaleDateString("en-CA");
}

function isoToDate(iso: string) {
  // Parse YYYY-MM-DD as local midnight to avoid tz shift
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function emptyForm(products: Product[]): FormState {
  return Object.fromEntries(
    products.map((p) => ({ 
      [p.id]: { 
        actual: "", 
        target: p.default_target?.toString() ?? "", // Fill with default_target from JSON
        isReadOnly: false 
      }
    })).map((entry) => Object.entries(entry)[0])
  );
}

function populateForm(products: Product[], entries: ProductionEntry[]): FormState {
  // Create a map of existing entries by product_id
  const entriesMap = new Map(
    entries.map((entry) => [entry.product_id, entry])
  );
  
  return Object.fromEntries(
    products.map((p) => {
      const existingEntry = entriesMap.get(p.id);
      
      if (existingEntry) {
        // Product has an entry for this date -> make it read-only
        return [
          p.id,
          {
            actual: existingEntry.actual_output != null ? String(existingEntry.actual_output) : "",
            target: existingEntry.target_output != null ? String(existingEntry.target_output) : "",
            isReadOnly: true,
          },
        ];
      } else {
        // No entry for this product -> use default_target and keep editable
        return [
          p.id,
          {
            actual: "",
            target: p.default_target?.toString() ?? "",
            isReadOnly: false,
          },
        ];
      }
    })
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

// ── props ─────────────────────────────────────────────────────────────────────

interface DailyProductionFormProps {
  products: Product[];
  entries: ProductionEntry[];
  onSave?: () => void;
}

// ── component ─────────────────────────────────────────────────────────────────

export default function DailyProductionForm({
  products,
  entries,
  onSave,
}: DailyProductionFormProps) {
  const today = getTodayISO();

  const [dateISO, setDateISO] = useState(today);
  const [calOpen, setCalOpen] = useState(false);

  const [activeEntries, setActiveEntries] = useState<ProductionEntry[]>(entries);
  const [fetchingEntries, setFetchingEntries] = useState(false);
  const [form, setForm] = useState<FormState>(() =>
    entries.length > 0 ? populateForm(products, entries) : emptyForm(products)
  );
  const [, setIsFormReadOnly] = useState(
    entries.length === products.length // Only readonly if ALL products have entries
  );

  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const cache = useRef<Record<string, ProductionEntry[]>>({
    [today]: entries,
  });

  // sync when parent refreshes today's entries
  useEffect(() => {
    cache.current[today] = entries;
    if (dateISO === today) {
      const hasEntries = entries.length > 0;
      setActiveEntries(entries);
      setForm(hasEntries ? populateForm(products, entries) : emptyForm(products));
      setIsFormReadOnly(entries.length === products.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries]);

  // ── date change ───────────────────────────────────────────────────────────

  async function handleDateChange(newISO: string) {
    setDateISO(newISO);
    setCalOpen(false);
    setStatus("idle");
    setStatusMsg("");

    if (cache.current[newISO] !== undefined) {
      const cached = cache.current[newISO];
      const hasEntries = cached.length > 0;
      setActiveEntries(cached);
      setForm(hasEntries ? populateForm(products, cached) : emptyForm(products));
      setIsFormReadOnly(cached.length === products.length);
      return;
    }

    setFetchingEntries(true);
    try {
      const data = await productionService.getByDate(newISO);
      cache.current[newISO] = data;
      const hasEntries = data.length > 0;
      setActiveEntries(data);
      setForm(hasEntries ? populateForm(products, data) : emptyForm(products));
      setIsFormReadOnly(data.length === products.length);
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

  function handleChange(productId: number, field: "actual" | "target", value: string) {
    const productForm = form[productId];
    if (!productForm || productForm.isReadOnly) return;
    
    setForm((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], [field]: value },
    }));
    setStatus("idle");
  }

  function handleReset() {
    const hasEntries = activeEntries.length > 0;
    setForm(hasEntries ? populateForm(products, activeEntries) : emptyForm(products));
    setStatus("idle");
    setStatusMsg("");
  }

  // ── save ──────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    // Check if there are any editable products with values
    const hasAnyValue = products.some(
      (p) => !form[p.id]?.isReadOnly && (form[p.id]?.actual !== "" || form[p.id]?.target !== "")
    );
    
    if (!hasAnyValue) {
      setStatus("error");
      setStatusMsg("Please enter at least one value before saving.");
      return;
    }

    const entriesToSave = products
      .filter((p) => !form[p.id]?.isReadOnly) // Only save editable products
      .filter((p) => form[p.id]?.actual !== "" || form[p.id]?.target !== "")
      .map((p) => ({
        product_id: p.id,
        production_date: dateISO,
        actual_output: parseFloat(form[p.id]?.actual ?? "0") || 0,
        target_output: parseFloat(form[p.id]?.target ?? "0") || 0,
        remarks: null,
      }));

    if (entriesToSave.length === 0) {
      setStatus("error");
      setStatusMsg("No entries to save.");
      return;
    }

    setIsSaving(true);
    try {
      const saved = await productionService.bulkCreate(entriesToSave);
      
      // Merge saved entries with existing ones
      const mergedEntries = [...activeEntries, ...saved];
      cache.current[dateISO] = mergedEntries;
      setActiveEntries(mergedEntries);
      
      // Update form with new read-only status
      setForm(populateForm(products, mergedEntries));
      setIsFormReadOnly(mergedEntries.length === products.length);
      
      setStatus("success");
      setStatusMsg(`Entries saved for ${format(isoToDate(dateISO), "PPP")}.`);
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

  const selectedDate = isoToDate(dateISO);
  const hasAnyEditableProduct = products.some(p => !form[p.id]?.isReadOnly);
  const showActionButtons = hasAnyEditableProduct && !fetchingEntries;

  return (
    <div className="space-y-4">

      {/* ── Date picker ─────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Daily Production Entry</CardTitle>
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
                  disabled={(d) => d > new Date()} // no future dates
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {!hasAnyEditableProduct && !fetchingEntries && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3 shrink-0" />
                All entries saved for this date
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Product tiles ───────────────────────────── */}
      {fetchingEntries ? (
        <InputSkeleton count={products.length} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {products.map((p) => {
            const productForm = form[p.id];
            const isReadOnly = productForm?.isReadOnly ?? false;
            
            return (
              <Card key={p.id} className={isReadOnly ? "opacity-70" : undefined}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-baseline justify-between mb-3">
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.unit ?? "—"}/day</p>
                  </div>
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
                          placeholder={field === "target" && !isReadOnly ? "Default target" : "0"}
                          readOnly={isReadOnly}
                          disabled={isSaving || (isReadOnly && field === "actual")}
                          value={productForm?.[field] ?? ""}
                          onChange={(e) => handleChange(p.id, field, e.target.value)}
                          className={
                            isReadOnly
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

      {/* ── Actions — shown only when there are editable products ─────────── */}
      {showActionButtons && (
        <div className="flex flex-col gap-3">
          {status !== "idle" && (
            <div
              className={`flex items-center gap-2 rounded-md px-4 py-3 text-sm ${
                status === "success"
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-rose-500/10 text-rose-600"
              }`}
            >
              {status === "success" ? (
                <CheckCircle className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              {statusMsg}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleReset} disabled={isSaving}>
              Reset
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isSaving ? "Saving…" : "Save entry"}
            </Button>
          </div>
        </div>
      )}

      {/* Success banner visible even after saving */}
      {status === "success" && (
        <div className="flex items-center gap-2 rounded-md px-4 py-3 text-sm bg-emerald-500/10 text-emerald-600">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {statusMsg}
        </div>
      )}
    </div>
  );
}