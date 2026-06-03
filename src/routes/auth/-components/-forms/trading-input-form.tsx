// src/routes/auth/-components/-forms/trading-input-form.tsx

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
  Globe,
  Building2,
} from "lucide-react";
import { tradingService } from "@/services/trading.service";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TradeRow {
  product_id: number;
  market: "Export" | "Local";
  counterparty: string;
  price_per_kg: number;
  quantity_kg: number;
  total_value: number;
  isReadOnly: boolean;
}

interface Product {
  id: number;
  name: string;
  unit?: string;
}

interface TradingInputFormProps {
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

function emptyRows(products: Product[]): Record<number, TradeRow> {
  return Object.fromEntries(
    products.map((p) => [
      p.id,
      {
        product_id: p.id,
        market: "Export" as "Export",
        counterparty: "",
        price_per_kg: 0,
        quantity_kg: 0,
        total_value: 0,
        isReadOnly: false,
      },
    ])
  );
}

function populateRows(products: Product[], trades: any[]): Record<number, TradeRow> {
  const tradesMap = new Map(trades.map((t) => [t.product_id, t]));
  return Object.fromEntries(
    products.map((p) => {
      const existing = tradesMap.get(p.id);
      const hasData = existing && (Number(existing.price_per_kg) > 0 || Number(existing.quantity_kg) > 0);
      return [
        p.id,
        {
          product_id: p.id,
          market: existing?.market ?? "Export",
          counterparty: existing?.counterparty ?? "",
          price_per_kg: existing ? Number(existing.price_per_kg) : 0,
          quantity_kg: existing ? Number(existing.quantity_kg) : 0,
          total_value: existing ? Number(existing.total_value) : 0,
          isReadOnly: !!hasData,
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

export default function TradingInputForm({
  products,
  loading,
  onSaved,
}: TradingInputFormProps) {
  const today = getTodayISO();

  // ── Date state ────────────────────────────────────────────────────────────
  const [dateISO, setDateISO] = useState(today);
  const [calOpen, setCalOpen] = useState(false);

  // ── Row + fetch state ─────────────────────────────────────────────────────
  const [rows, setRows] = useState<Record<number, TradeRow>>({});
  const [fetchingRows, setFetchingRows] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAllReadOnly, setIsAllReadOnly] = useState(false);

  // Track which product IDs have been manually unlocked for editing
  const [unlockedIds, setUnlockedIds] = useState<Set<number>>(new Set());

  // Display values for formatted numbers
  const [displayValues, setDisplayValues] = useState<Record<number, { price_per_kg: string; quantity_kg: string }>>({});

  // ── Status banners ────────────────────────────────────────────────────────
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");

  // Cache fetched trades per date
  const cache = useRef<Record<string, any[]>>({});

  // Initialize display values when rows change
  useEffect(() => {
    const newDisplay: Record<number, { price_per_kg: string; quantity_kg: string }> = {};
    Object.entries(rows).forEach(([id, row]) => {
      newDisplay[Number(id)] = {
        price_per_kg: row.price_per_kg ? formatDisplayValue(row.price_per_kg) : "",
        quantity_kg: row.quantity_kg ? formatDisplayValue(row.quantity_kg) : ""
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
      const { data } = await tradingService.getLatest(iso, iso);
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

  function applyRows(prods: Product[], trades: any[]) {
    const populated = populateRows(prods, trades);
    setRows(populated);
    const allReadOnly = prods.every((p) => populated[p.id]?.isReadOnly);
    setIsAllReadOnly(allReadOnly);
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

  function setMarket(id: number, market: "Export" | "Local") {
    if (rows[id]?.isReadOnly && !unlockedIds.has(id)) return;
    setRows((r) => ({ ...r, [id]: { ...r[id], market } }));
    setStatus("idle");
  }

  function setCounterparty(id: number, value: string) {
    if (rows[id]?.isReadOnly && !unlockedIds.has(id)) return;
    setRows((r) => ({ ...r, [id]: { ...r[id], counterparty: value } }));
    setStatus("idle");
  }

  function setNumeric(id: number, field: "price_per_kg" | "quantity_kg", formattedValue: string) {
    if (rows[id]?.isReadOnly && !unlockedIds.has(id)) return;
    
    const rawValue = formattedValue.replace(/,/g, '');
    const val = parseFloat(rawValue) || 0;
    
    setRows((r) => {
      const updated = { ...r[id], [field]: val };
      updated.total_value = updated.price_per_kg * updated.quantity_kg;
      return { ...r, [id]: updated };
    });
    
    setDisplayValues(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: formattedValue
      }
    }));
    
    setStatus("idle");
  }

  function handleBlur(id: number, field: "price_per_kg" | "quantity_kg") {
    const row = rows[id];
    if (row) {
      const value = field === "price_per_kg" ? row.price_per_kg : row.quantity_kg;
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

  function handleFocus(id: number, field: "price_per_kg" | "quantity_kg") {
    const row = rows[id];
    if (row) {
      const rawValue = field === "price_per_kg" ? row.price_per_kg : row.quantity_kg;
      setDisplayValues(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          [field]: rawValue.toString()
        }
      }));
    }
  }

  // ── Unlock / Relock functions ───────────────────────────────────────────
  
  function unlockProduct(productId: number) {
    setUnlockedIds((prev) => new Set(prev).add(productId));
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
    
    const cachedTrades = cache.current[dateISO];
    if (cachedTrades) {
      const originalTrade = cachedTrades.find((t) => t.product_id === productId);
      if (originalTrade) {
        setRows((prev) => ({
          ...prev,
          [productId]: {
            ...prev[productId],
            market: originalTrade.market,
            counterparty: originalTrade.counterparty || "",
            price_per_kg: Number(originalTrade.price_per_kg),
            quantity_kg: Number(originalTrade.quantity_kg),
            total_value: Number(originalTrade.total_value),
            isReadOnly: true,
          },
        }));
      } else {
        setRows((prev) => ({
          ...prev,
          [productId]: {
            ...prev[productId],
            price_per_kg: 0,
            quantity_kg: 0,
            total_value: 0,
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

  // ── Save ─────────────────────────────────────────────────────────────────

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    const rowsToSave = Object.values(rows).filter((r) => {
      if (unlockedIds.has(r.product_id)) return true;
      if (!r.isReadOnly && r.price_per_kg > 0 && r.quantity_kg > 0) return true;
      return false;
    });

    if (rowsToSave.length === 0) {
      setStatus("error");
      setStatusMsg("Please enter price and quantity for at least one product, or unlock a saved trade to update it.");
      return;
    }

    const payload = rowsToSave.map((r) => ({
      product_id: r.product_id,
      market: r.market,
      counterparty: r.counterparty || null,
      price_per_kg: r.price_per_kg,
      quantity_kg: r.quantity_kg,
      total_value: r.total_value,
    }));

    setIsSaving(true);
    try {
      await tradingService.storeBulk(payload, dateISO);

      delete cache.current[dateISO];
      await fetchForDate(dateISO);
      setUnlockedIds(new Set());

      setStatus("success");
      setStatusMsg(`Trades ${rowsToSave.some(r => rows[r.product_id]?.isReadOnly) ? 'updated' : 'saved'} for ${format(isoToDate(dateISO), "PPP")}.`);
      onSaved();
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

  const selectedDate = isoToDate(dateISO);
  const hasEditableRows = Object.values(rows).some((r) => !r.isReadOnly);
  const hasUnlockedRows = unlockedIds.size > 0;
  const showActionButtons = (hasEditableRows || hasUnlockedRows) && !fetchingRows;

  return (
    <div className="space-y-4">

      {/* ── Date picker card ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Trade Entry</CardTitle>
          <CardDescription>Enter price and quantity for each product line</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 flex-wrap">
            <Label className="text-sm whitespace-nowrap">Trade Date</Label>

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

            {isAllReadOnly && !fetchingRows && unlockedIds.size === 0 && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3 shrink-0" />
                All trades saved — click <Pencil className="h-3 w-3 inline mx-0.5" /> to update
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
      {status === "error" && <ErrorBanner message={statusMsg} />}

      {/* ── Product tiles ── */}
      {loading || fetchingRows ? (
        <InputSkeleton count={products.length || 4} />
      ) : (
        <form onSubmit={handleSave} noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {products.map((p) => {
              const row = rows[p.id];
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
                        <span className="text-xs text-muted-foreground">{p.unit ?? "kg"}</span>
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
                              aria-label="Edit trade entry"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Market toggle */}
                    <div className="flex gap-2">
                      {(["Export", "Local"] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => isEditable && setMarket(p.id, m)}
                          className="focus:outline-none"
                          disabled={!isEditable || isSaving}
                        >
                          <Badge
                            variant={row?.market === m ? (m === "Export" ? "default" : "secondary") : "outline"}
                            className={`px-3 py-0.5 text-xs select-none transition-all ${
                              isEditable ? "cursor-pointer" : "cursor-default"
                            }`}
                          >
                            {m === "Export" ? (
                              <><Globe className="h-3 w-3 mr-1 inline" />Export</>
                            ) : (
                              <><Building2 className="h-3 w-3 mr-1 inline" />Local</>
                            )}
                          </Badge>
                        </button>
                      ))}
                    </div>

                    {/* Counterparty */}
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Counterparty</p>
                      <Input
                        type="text"
                        placeholder="Buyer name (optional)"
                        className={`h-9 text-sm ${!isEditable ? "bg-muted cursor-default pointer-events-none" : ""}`}
                        value={row?.counterparty ?? ""}
                        readOnly={!isEditable}
                        disabled={isSaving || !isEditable}
                        onChange={(e) => setCounterparty(p.id, e.target.value)}
                      />
                    </div>

                    {/* Price + Quantity */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Price ($/Kg)</p>
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
                            value={displayRow?.price_per_kg ?? (row?.price_per_kg ? formatDisplayValue(row.price_per_kg) : "")}
                            readOnly={!isEditable}
                            disabled={isSaving || !isEditable}
                            onChange={(e) => setNumeric(p.id, "price_per_kg", e.target.value)}
                            onFocus={() => handleFocus(p.id, "price_per_kg")}
                            onBlur={() => handleBlur(p.id, "price_per_kg")}
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
                          value={displayRow?.quantity_kg ?? (row?.quantity_kg ? formatDisplayValue(row.quantity_kg) : "")}
                          readOnly={!isEditable}
                          disabled={isSaving || !isEditable}
                          onChange={(e) => setNumeric(p.id, "quantity_kg", e.target.value)}
                          onFocus={() => handleFocus(p.id, "quantity_kg")}
                          onBlur={() => handleBlur(p.id, "quantity_kg")}
                        />
                      </div>
                    </div>

                    {/* Auto-total */}
                    {(row?.total_value ?? 0) > 0 && (
                      <p className="text-xs text-muted-foreground text-right">
                        Total:{" "}
                        <span className="font-medium text-foreground">
                          {fmtUSD(row.total_value)}
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
                    ? `Update ${unlockedIds.size} trade${unlockedIds.size === 1 ? '' : 's'}`
                    : "Save Trades"
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