"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { BarChart2, CalendarIcon, PlusCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useProductsStore } from "@/store/products.store";
import { useSalesStore } from "@/store/sales.store";
import { Market, Sale, SalesSummary } from "@/types/sales.types";
import SalesInputForm from "../-forms/sales-input-form";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "view" | "input";

interface SaleRow {
  product_id: number;
  market: Market;
  aspPerKg: number;
  quantityKg: number;
  totalSalesUSD: number;
}

interface SalesDashProps {
  initialData?: {
    sales: Sale[];
    summary: SalesSummary;
    dateRange: { from: string; to: string };
  };
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString();
}

function fmtUSD(n: number) {
  return (
    "$" +
    n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function ViewSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-4 pb-4 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="pt-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </CardContent>
      </Card>
    </>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function getCurrentMonthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    from: format(from, "yyyy-MM-dd"),
    to: format(to, "yyyy-MM-dd"),
  };
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SalesDash({ initialData }: SalesDashProps) {
  const [tab, setTab] = useState<Tab>("view");
  const [, setRows] = useState<Record<number, SaleRow>>({});

  // ── Products store ──────────────────────────────────────────────────────────
  const {
    products,
    loading: productsLoading,
    fetchProducts,
  } = useProductsStore();

  // ── Sales store ─────────────────────────────────────────────────────────────
  const {
    sales,
    summary,
    dateRange,
    loading: salesLoading,
    fetchAll,
    setDateRange,
    setSalesData,
  } = useSalesStore();

  // ── Date range local state (calendar pickers) ───────────────────────────────
  const [from, setFrom] = useState<Date | undefined>(
    dateRange.from ? new Date(dateRange.from) : undefined,
  );
  const [to, setTo] = useState<Date | undefined>(
    dateRange.to ? new Date(dateRange.to) : undefined,
  );

  // ── Sync local picker state when store dateRange changes ────────────────────
  useEffect(() => {
    setFrom(dateRange.from ? new Date(dateRange.from) : undefined);
    setTo(dateRange.to ? new Date(dateRange.to) : undefined);
  }, [dateRange.from, dateRange.to]);

  // ── Hydrate from loader data, or fetch on mount ─────────────────────────────
  const initDone = useRef(false);
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    if (initialData) {
      setSalesData(initialData.sales, initialData.summary, initialData.dateRange);
    } else {
      setDateRange(getCurrentMonthRange()); // store calls fetchAll internally
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch products once ─────────────────────────────────────────────────────
  const productsFetched = useRef(false);
  useEffect(() => {
    if (productsFetched.current) return;
    productsFetched.current = true;
    fetchProducts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Seed form rows from products ────────────────────────────────────────────
  useEffect(() => {
    if (products.length === 0) return;
    setRows((prev) => {
      const next = { ...prev };
      for (const p of products) {
        if (!next[p.id]) {
          const existing = sales.find((s) => s.product_id === p.id);
          next[p.id] = {
            product_id: p.id,
            market: existing?.market ?? "Export",
            aspPerKg: existing ? Number(existing.asp_per_kg) : 0,
            quantityKg: existing ? Number(existing.quantity_kg) : 0,
            totalSalesUSD: existing ? Number(existing.total_sales_usd) : 0,
          };
        }
      }
      return next;
    });
  }, [products, sales]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleFilter() {
    const fromStr = from ? format(from, "yyyy-MM-dd") : null;
    const toStr = to ? format(to, "yyyy-MM-dd") : null;
    setDateRange({ from: fromStr, to: toStr }); // calls fetchAll internally
  }

  function handleClearFilter() {
    setFrom(undefined);
    setTo(undefined);
    setDateRange(getCurrentMonthRange()); // calls fetchAll internally
  }

  // ── Derived ─────────────────────────────────────────────────────────────────

  const { total_sales_usd, total_quantity_kg, export_count, local_count } = summary;
  const loading = productsLoading || salesLoading;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted w-fit">
        {(["view", "input"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${
              tab === t
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "view" && <BarChart2 className="h-3.5 w-3.5" />}
            {t === "input" && <PlusCircle className="h-3.5 w-3.5" />}
            {t}
          </button>
        ))}
      </div>

      {/* ── VIEW TAB ── */}
      {tab === "view" && (
        <div className="space-y-4">
          {/* Date range filter */}
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">From</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[240px] justify-start text-left font-normal h-9",
                      !from && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {from ? format(from, "PPP") : "Select start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={from}
                    onSelect={setFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">To</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[240px] justify-start text-left font-normal h-9",
                      !to && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {to ? format(to, "PPP") : "Select end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={to}
                    onSelect={setTo}
                    disabled={from ? { before: from } : undefined}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button size="sm" onClick={handleFilter} className="h-9">
              Filter
            </Button>

            {(dateRange.from || dateRange.to) && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearFilter}
                className="h-9"
              >
                Clear
              </Button>
            )}
          </div>

          {/* Active filter label */}
          {dateRange.from && dateRange.to && (
            <div className="text-xs text-muted-foreground">
              Showing data from {format(new Date(dateRange.from), "PPP")} to{" "}
              {format(new Date(dateRange.to), "PPP")}
            </div>
          )}

          {loading ? (
            <ViewSkeleton />
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground mb-1">Total Sales (USD)</p>
                    <p className="text-xl font-semibold">{fmtUSD(total_sales_usd)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground mb-1">Total Volume (Kg)</p>
                    <p className="text-2xl font-semibold">{fmt(total_quantity_kg)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground mb-1">Export lines</p>
                    <p className="text-2xl font-semibold">{export_count}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground mb-1">Local lines</p>
                    <p className="text-2xl font-semibold">{local_count}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Table */}
              {sales.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-sm text-muted-foreground">
                    {dateRange.from || dateRange.to
                      ? `No sales found for the selected date range (${dateRange.from} to ${dateRange.to}).`
                      : "No sales recorded yet. Use the Input tab to add sales."}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-4">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="font-semibold">Product</TableHead>
                          <TableHead className="font-semibold">Market</TableHead>
                          <TableHead className="text-right font-semibold">ASP $/Kg</TableHead>
                          <TableHead className="text-right font-semibold">Quantity (Kg)</TableHead>
                          <TableHead className="text-right font-semibold">Total Sales ($)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sales.map((s) => (
                          <TableRow key={s.id}>
                            <TableCell className="font-medium">
                              {s.product?.name ?? `Product #${s.product_id}`}
                            </TableCell>
                            <TableCell>
                              <Badge variant={s.market === "Export" ? "default" : "outline"}>
                                {s.market}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {fmtUSD(Number(s.asp_per_kg))}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {fmt(Number(s.quantity_kg))}
                            </TableCell>
                            <TableCell className="text-right font-medium tabular-nums">
                              {fmtUSD(Number(s.total_sales_usd))}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="border-t-2">
                          <TableCell colSpan={3} className="font-semibold">Total</TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">
                            {fmt(total_quantity_kg)}
                          </TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">
                            {fmtUSD(total_sales_usd)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* ── INPUT TAB ── */}
      {tab === "input" && (
        <SalesInputForm
          products={products}
          loading={productsLoading}
          onSaved={() => {
            const { from, to } = dateRange;
            fetchAll(from ?? undefined, to ?? undefined);
          }}
        />
      )}
    </div>
  );
}