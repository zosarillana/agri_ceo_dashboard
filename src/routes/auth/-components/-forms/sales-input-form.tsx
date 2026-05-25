"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  CalendarIcon,
  Lock,
  Loader2,
  Pencil,
  X,
} from "lucide-react";
import { Market, Sale } from "@/types/sales.types";
import { salesService } from "@/services/sales.service";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SaleRow {
  product_id: number;
  market: Market;
  aspPerKg: number;
  quantityKg: number;
  totalSalesUSD: number;
  isReadOnly: boolean;
}

interface Product {
  id: number;
  name: string;
  unit?: string;
}

interface SalesInputFormProps {
  products: Product[];
  loading: boolean;
  onSaved: () => void;
}

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

function fmtUSD(n: number) {
  return "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Helper function to format numbers with commas for display
function formatDisplayValue(value: number | string): string {
  if (value === "" || value === null || value === undefined) return "";
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);
  if (Number.isInteger(num)) {
    return num.toLocaleString();
  } else {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}

function emptyRows(products: Product[]): Record<number, SaleRow> {
  return Object.fromEntries(
    products.map((p) => [
      p.id,
      {
        product_id:    p.id,
        market:        "Export" as Market,
        aspPerKg:      0,
        quantityKg:    0,
        totalSalesUSD: 0,
        isReadOnly:    false,
      },
    ])
  );
}

function populateRows(products: Product[], sales: Sale[]): Record<number, SaleRow> {
  const salesMap = new Map(sales.map((s) => [s.product_id, s]));
  return Object.fromEntries(
    products.map((p) => {
      const existing = salesMap.get(p.id);
      const hasData  = existing && (Number(existing.asp_per_kg) > 0 || Number(existing.quantity_kg) > 0);
      return [
        p.id,
        {
          product_id:    p.id,
          market:        existing?.market ?? "Export",
          aspPerKg:      existing ? Number(existing.asp_per_kg)      : 0,
          quantityKg:    existing ? Number(existing.quantity_kg)     : 0,
          totalSalesUSD: existing ? Number(existing.total_sales_usd) : 0,
          isReadOnly:    !!hasData,
        },
      ];
    })
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function InputSkeleton({ count = 4 }: { count?: number }) {
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

export default function SalesInputForm({
  products,
  loading,
  onSaved,
}: SalesInputFormProps) {
  const today = getTodayISO();

  // ── Date state ────────────────────────────────────────────────────────────
  const [dateISO, setDateISO] = useState(today);
  const [calOpen, setCalOpen] = useState(false);

  // ── Row + fetch state ─────────────────────────────────────────────────────
  const [rows, setRows]               = useState<Record<number, SaleRow>>({});
  const [fetchingRows, setFetchingRows] = useState(false);
  const [isSaving, setIsSaving]       = useState(false);
  const [isAllReadOnly, setIsAllReadOnly] = useState(false);

  // Track which product IDs have been manually unlocked for editing
  const [unlockedIds, setUnlockedIds] = useState<Set<number>>(new Set());

  // Display values for formatted numbers
  const [displayValues, setDisplayValues] = useState<Record<number, { aspPerKg: string; quantityKg: string }>>({});

  // ── Status banners ────────────────────────────────────────────────────────
  const [status, setStatus]       = useState<"idle" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");

  // Cache fetched sales per date so we don't re-fetch on tab switch
  const cache = useRef<Record<string, Sale[]>>({});

  // Initialize display values when rows change
  useEffect(() => {
    const newDisplay: Record<number, { aspPerKg: string; quantityKg: string }> = {};
    Object.entries(rows).forEach(([id, row]) => {
      newDisplay[Number(id)] = {
        aspPerKg: row.aspPerKg ? formatDisplayValue(row.aspPerKg) : "",
        quantityKg: row.quantityKg ? formatDisplayValue(row.quantityKg) : ""
      };
    });
    setDisplayValues(newDisplay);
  }, [rows]);

  // ── Seed rows when products load ─────────────────────────────────────────
  useEffect(() => {
    if (products.length === 0) return;
    fetchForDate(today);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  // ── Date fetch ────────────────────────────────────────────────────────────

  async function fetchForDate(iso: string) {
    if (cache.current[iso] !== undefined) {
      applyRows(products, cache.current[iso]);
      return;
    }

    setFetchingRows(true);
    try {
      // Fetch sales for this specific day only
      const { data } = await salesService.getLatest(iso, iso);
      cache.current[iso] = data;
      applyRows(products, data);
    } catch {
      cache.current[iso] = [];
      setRows(emptyRows(products));
      setIsAllReadOnly(false);
      setUnlockedIds(new Set());
    } finally {
      setFetchingRows(false);
    }
  }

  function applyRows(prods: Product[], sales: Sale[]) {
    const populated = populateRows(prods, sales);
    setRows(populated);
    const allReadOnly = prods.every((p) => populated[p.id]?.isReadOnly);
    setIsAllReadOnly(allReadOnly);
    // Reset unlocked IDs when loading new data
    setUnlockedIds(new Set());
  }

  async function handleDateChange(newISO: string) {
    setDateISO(newISO);
    setCalOpen(false);
    setStatus("idle");
    setStatusMsg("");
    await fetchForDate(newISO);
  }

  // ── Row helpers ───────────────────────────────────────────────────────────

  function setMarket(id: number, market: Market) {
    // Only allow market change if row is editable (unlocked or not read-only)
    if (rows[id]?.isReadOnly && !unlockedIds.has(id)) return;
    setRows((r) => ({ ...r, [id]: { ...r[id], market } }));
    setStatus("idle");
  }

  function setNumeric(id: number, field: "aspPerKg" | "quantityKg", formattedValue: string) {
    // Only allow numeric changes if row is editable (unlocked or not read-only)
    if (rows[id]?.isReadOnly && !unlockedIds.has(id)) return;
    
    // Remove commas to get raw number
    const rawValue = formattedValue.replace(/,/g, '');
    const val = parseFloat(rawValue) || 0;
    
    setRows((r) => {
      const updated = { ...r[id], [field]: val };
      updated.totalSalesUSD = updated.aspPerKg * updated.quantityKg;
      return { ...r, [id]: updated };
    });
    
    // Update display value with formatted version
    setDisplayValues(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: formattedValue
      }
    }));
    
    setStatus("idle");
  }

  function handleBlur(id: number, field: "aspPerKg" | "quantityKg") {
    const row = rows[id];
    if (row) {
      const value = field === "aspPerKg" ? row.aspPerKg : row.quantityKg;
      const formatted = formatDisplayValue(value);
      setDisplayValues(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          [field]: formatted
        }
      }));
    }
  }

  function handleFocus(id: number, field: "aspPerKg" | "quantityKg") {
    const row = rows[id];
    if (row) {
      const rawValue = field === "aspPerKg" ? row.aspPerKg : row.quantityKg;
      setDisplayValues(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          [field]: rawValue.toString()
        }
      }));
    }
  }

  // ── Unlock / Relock functions (UPDATE TRIGGER) ───────────────────────────
  
  function unlockProduct(productId: number) {
    setUnlockedIds((prev) => new Set(prev).add(productId));
    // Make the row editable in UI
    setRows((prev) => ({
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
    
    // Restore original values from cache and re-lock
    const cachedSales = cache.current[dateISO];
    if (cachedSales) {
      const originalSale = cachedSales.find((s) => s.product_id === productId);
      if (originalSale) {
        setRows((prev) => ({
          ...prev,
          [productId]: {
            ...prev[productId],
            market: originalSale.market,
            aspPerKg: Number(originalSale.asp_per_kg),
            quantityKg: Number(originalSale.quantity_kg),
            totalSalesUSD: Number(originalSale.total_sales_usd),
            isReadOnly: true,
          },
        }));
      } else {
        // If no original sale, reset to empty state
        setRows((prev) => ({
          ...prev,
          [productId]: {
            ...prev[productId],
            aspPerKg: 0,
            quantityKg: 0,
            totalSalesUSD: 0,
            isReadOnly: false,
          },
        }));
      }
    }
    setStatus("idle");
    setStatusMsg("");
  }

  function handleReset() {
    if (cache.current[dateISO]) {
      applyRows(products, cache.current[dateISO]);
    } else {
      setRows(emptyRows(products));
    }
    setUnlockedIds(new Set());
    setStatus("idle");
    setStatusMsg("");
  }

  // ── Save (supports both create and update) ─────────────────────────────────

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    // Determine which rows to save:
    // 1. Any unlocked row (even if values are zero)
    // 2. Any editable row that has values > 0
    const rowsToSave = Object.values(rows).filter((r) => {
      if (unlockedIds.has(r.product_id)) return true;
      if (!r.isReadOnly && r.aspPerKg > 0 && r.quantityKg > 0) return true;
      return false;
    });

    if (rowsToSave.length === 0) {
      setStatus("error");
      setStatusMsg("Please enter ASP and quantity for at least one product, or unlock a saved entry to update it.");
      return;
    }

    const payload = rowsToSave.map((r) => ({
      product_id:  r.product_id,
      market:      r.market,
      asp_per_kg:  r.aspPerKg,
      quantity_kg: r.quantityKg,
    }));

    setIsSaving(true);
    try {
      // Pass the selected date to the service - this will UPSERT (update or insert)
      await salesService.storeBulk(payload, dateISO);

      // Invalidate cache for this date and re-fetch so read-only state is accurate
      delete cache.current[dateISO];
      await fetchForDate(dateISO);

      // Clear unlocked IDs since everything is now saved
      setUnlockedIds(new Set());

      setStatus("success");
      setStatusMsg(`Sales ${rowsToSave.some(r => rows[r.product_id]?.isReadOnly) ? 'updated' : 'saved'} for ${format(isoToDate(dateISO), "PPP")}.`);
      onSaved(); // notify parent to re-fetch view tab
    } catch (err: any) {
      setStatus("error");
      setStatusMsg(err?.response?.data?.message ?? "Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (!loading && products.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No products found. Add products in Production → Products tab.
        </CardContent>
      </Card>
    );
  }

  const selectedDate        = isoToDate(dateISO);
  const hasEditableRows     = Object.values(rows).some((r) => !r.isReadOnly);
  const hasUnlockedRows     = unlockedIds.size > 0;
  const showActionButtons   = (hasEditableRows || hasUnlockedRows) && !fetchingRows;

  return (
    <div className="space-y-4">

      {/* ── Date picker card ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Sales Entry</CardTitle>
          <CardDescription>Enter ASP and quantity for each product line</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 flex-wrap">
            <Label className="text-sm whitespace-nowrap">Sale Date</Label>

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
                  disabled={(d) => d > new Date()} // Can't select future dates
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {isAllReadOnly && !fetchingRows && unlockedIds.size === 0 && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3 shrink-0" />
                All sales saved — click <Pencil className="h-3 w-3 inline mx-0.5" /> to update
              </span>
            )}
            
            {unlockedIds.size > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-amber-600">
                <Pencil className="h-3 w-3 shrink-0" />
                {unlockedIds.size} product{unlockedIds.size === 1 ? '' : 's'} unlocked for editing
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Status banners ── */}
      {status === "success" && <SuccessBanner message={statusMsg} />}
      {status === "error"   && <ErrorBanner   message={statusMsg} />}

      {/* ── Product tiles ── */}
      {loading || fetchingRows ? (
        <InputSkeleton count={products.length || 4} />
      ) : (
        <form onSubmit={handleSave} noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {products.map((p) => {
              const row        = rows[p.id];
              const isReadOnly = row?.isReadOnly ?? false;
              const isUnlocked = unlockedIds.has(p.id);
              const isEditable = !isReadOnly || isUnlocked;
              const displayRow = displayValues[p.id];

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
                  <CardContent className="pt-4 pb-4 space-y-3">

                    {/* Header */}
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{p.name}</p>
                        {isUnlocked && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 font-medium">
                            editing
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{p.unit ?? "—"}</span>
                        {/* Unlock / relock button — only for saved entries */}
                        {(isReadOnly || isUnlocked) && (
                          isUnlocked ? (
                            <button
                              type="button"
                              onClick={() => relockProduct(p.id)}
                              disabled={isSaving}
                              className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                              aria-label="Cancel edit"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => unlockProduct(p.id)}
                              disabled={isSaving}
                              className="p-0.5 rounded text-muted-foreground hover:text-amber-600 transition-colors disabled:opacity-50"
                              aria-label="Edit sales entry"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Market toggle */}
                    <div className="flex gap-2">
                      {(["Export", "Local"] as Market[]).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => isEditable && setMarket(p.id, m)}
                          className="focus:outline-none"
                          disabled={!isEditable || isSaving}
                        >
                          <Badge
                            variant={
                              row?.market === m
                                ? m === "Export" ? "default" : "secondary"
                                : "outline"
                            }
                            className={`px-3 py-0.5 text-xs select-none transition-all ${
                              isEditable ? "cursor-pointer" : "cursor-default"
                            }`}
                          >
                            {m}
                          </Badge>
                        </button>
                      ))}
                    </div>

                    {/* ASP + Quantity */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">ASP ($/Kg)</p>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                            $
                          </span>
                          <Input
                            type="text"
                            min={0}
                            step="0.01"
                            placeholder="0.00"
                            className={`pl-5 h-9 text-sm ${!isEditable ? "bg-muted cursor-default pointer-events-none" : ""}`}
                            value={displayRow?.aspPerKg ?? (row?.aspPerKg ? formatDisplayValue(row.aspPerKg) : "")}
                            readOnly={!isEditable}
                            disabled={isSaving || !isEditable}
                            onChange={(e) => setNumeric(p.id, "aspPerKg", e.target.value)}
                            onFocus={() => handleFocus(p.id, "aspPerKg")}
                            onBlur={() => handleBlur(p.id, "aspPerKg")}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Quantity (Kg)</p>
                        <Input
                          type="text"
                          min={0}
                          step="0.01"
                          placeholder="0"
                          className={`h-9 text-sm ${!isEditable ? "bg-muted cursor-default pointer-events-none" : ""}`}
                          value={displayRow?.quantityKg ?? (row?.quantityKg ? formatDisplayValue(row.quantityKg) : "")}
                          readOnly={!isEditable}
                          disabled={isSaving || !isEditable}
                          onChange={(e) => setNumeric(p.id, "quantityKg", e.target.value)}
                          onFocus={() => handleFocus(p.id, "quantityKg")}
                          onBlur={() => handleBlur(p.id, "quantityKg")}
                        />
                      </div>
                    </div>

                    {/* Auto-total */}
                    {(row?.totalSalesUSD ?? 0) > 0 && (
                      <p className="text-xs text-muted-foreground text-right">
                        Total:{" "}
                        <span className="font-medium text-foreground">
                          {fmtUSD(row.totalSalesUSD)}
                        </span>
                      </p>
                    )}

                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Save / Reset */}
          {showActionButtons && (
            <div className="flex items-center gap-3 mt-4">
              <Button type="submit" disabled={isSaving} className="flex-1">
                {isSaving
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
                  : hasUnlockedRows
                    ? `Update ${unlockedIds.size} sale${unlockedIds.size === 1 ? '' : 's'}`
                    : "Save Sales"
                }
              </Button>
              <Button type="button" variant="outline" onClick={handleReset} disabled={isSaving}>
                Reset
              </Button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}