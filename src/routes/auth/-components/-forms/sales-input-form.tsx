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

  // ── Status banners ────────────────────────────────────────────────────────
  const [status, setStatus]       = useState<"idle" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");

  // Cache fetched sales per date so we don't re-fetch on tab switch
  const cache = useRef<Record<string, Sale[]>>({});

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
    } finally {
      setFetchingRows(false);
    }
  }

  function applyRows(prods: Product[], sales: Sale[]) {
    const populated = populateRows(prods, sales);
    setRows(populated);
    const allReadOnly = prods.every((p) => populated[p.id]?.isReadOnly);
    setIsAllReadOnly(allReadOnly);
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
    setRows((r) => ({ ...r, [id]: { ...r[id], market } }));
    setStatus("idle");
  }

  function setNumeric(id: number, field: "aspPerKg" | "quantityKg", raw: string) {
    if (rows[id]?.isReadOnly) return;
    const val = parseFloat(raw) || 0;
    setRows((r) => {
      const updated = { ...r[id], [field]: val };
      updated.totalSalesUSD = updated.aspPerKg * updated.quantityKg;
      return { ...r, [id]: updated };
    });
    setStatus("idle");
  }

  function handleReset() {
    if (cache.current[dateISO]) {
      applyRows(products, cache.current[dateISO]);
    } else {
      setRows(emptyRows(products));
    }
    setStatus("idle");
    setStatusMsg("");
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    const payload = Object.values(rows)
      .filter((r) => !r.isReadOnly && r.aspPerKg > 0 && r.quantityKg > 0)
      .map((r) => ({
        product_id:  r.product_id,
        market:      r.market,
        asp_per_kg:  r.aspPerKg,
        quantity_kg: r.quantityKg,
      }));

    if (payload.length === 0) {
      setStatus("error");
      setStatusMsg("Please enter ASP and quantity for at least one product.");
      return;
    }

    setIsSaving(true);
    try {
      // Pass the selected date to the service
      await salesService.storeBulk(payload, dateISO);

      // Invalidate cache for this date and re-fetch so read-only state is accurate
      delete cache.current[dateISO];
      await fetchForDate(dateISO);

      setStatus("success");
      setStatusMsg(`Sales saved for ${format(isoToDate(dateISO), "PPP")}.`);
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
  const showActionButtons   = hasEditableRows && !fetchingRows;

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

            {isAllReadOnly && !fetchingRows && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3 shrink-0" />
                All sales saved for this date
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

              return (
                <Card key={p.id} className={isReadOnly ? "opacity-70" : undefined}>
                  <CardContent className="pt-4 pb-4 space-y-3">

                    {/* Header */}
                    <div className="flex items-baseline justify-between">
                      <p className="text-sm font-medium">{p.name}</p>
                      <span className="text-xs text-muted-foreground">{p.unit ?? "—"}</span>
                    </div>

                    {/* Market toggle */}
                    <div className="flex gap-2">
                      {(["Export", "Local"] as Market[]).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => !isReadOnly && setMarket(p.id, m)}
                          className="focus:outline-none"
                          disabled={isReadOnly || isSaving}
                        >
                          <Badge
                            variant={
                              row?.market === m
                                ? m === "Export" ? "default" : "secondary"
                                : "outline"
                            }
                            className={`px-3 py-0.5 text-xs select-none transition-all ${
                              isReadOnly ? "cursor-default" : "cursor-pointer"
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
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="0.00"
                            className={`pl-5 h-9 text-sm ${isReadOnly ? "bg-muted cursor-default pointer-events-none" : ""}`}
                            value={row?.aspPerKg || ""}
                            readOnly={isReadOnly}
                            disabled={isSaving || isReadOnly}
                            onChange={(e) => setNumeric(p.id, "aspPerKg", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Quantity (Kg)</p>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="0"
                          className={`h-9 text-sm ${isReadOnly ? "bg-muted cursor-default pointer-events-none" : ""}`}
                          value={row?.quantityKg || ""}
                          readOnly={isReadOnly}
                          disabled={isSaving || isReadOnly}
                          onChange={(e) => setNumeric(p.id, "quantityKg", e.target.value)}
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