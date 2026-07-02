"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
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

import { Sale, SalesSummary } from "@/types/sales.types";
import SalesInputForm from "../-forms/sales-input-form";

import { useRole } from "@/hooks/use-role";
import { getAllowedTabs, type Tab } from "@/lib/permissions";

// ─── Types ─────────────────────────────────────────────

interface SalesDashProps {
  initialData?: {
    sales: Sale[];
    summary: SalesSummary;
    dateRange: { from: string; to: string };
  };
}

// Aggregated row: one product, qty/sales/asp summed or recomputed across
// every sale for that product within the currently filtered date range.
// asp_total_usd is recomputed as a weighted average from the original sale data
type GroupedRow = {
  key: string;
  product_id: number | null;
  product_name: string;
  market: Sale["market"];
  sales: number;
  asp_total_usd: number;
  quantity_kg: number;
  total_sales_usd: number;
  first_date: string;
  last_date: string;
  entry_count: number;
};

// ─── Formatters ────────────────────────────────────────

function toSafeNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function fmt(n: number) {
  return toSafeNumber(n).toLocaleString();
}

function fmtUSD(n: number) {
  return (
    "$" +
    toSafeNumber(n).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

// ─── Date Helpers ───────────────────────────────────────

/**
 * Parse a date string in YYYY-MM-DD format as local date
 * This prevents timezone issues with UTC date parsing
 */
function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return new Date(
      parseInt(parts[0]),
      parseInt(parts[1]) - 1,
      parseInt(parts[2]),
    );
  }
  return new Date(dateStr);
}

/**
 * Format a date to YYYY-MM-DD string using local timezone
 */
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get the current month range in local timezone
 */
function getCurrentMonthRange() {
  const now = new Date();
  const from = startOfMonth(now);
  const to = endOfMonth(now);

  return {
    from: formatLocalDate(from),
    to: formatLocalDate(to),
  };
}

// ─── Grouping helper ─────────────────────────────────────
// Group raw sales by product only (NOT by date, NOT by market) and sum
// qty/sales/total across every sale for that product in the filtered range.
// asp_total_usd is recomputed as a weighted average from the original data
function groupSales(sales: Sale[]): GroupedRow[] {
  const map = new Map<string, GroupedRow>();

  for (const sale of sales) {
    const key = String(sale.product_id);
    const existing = map.get(key);
    const saleTime = new Date(sale.sale_date).getTime();
    const qty = toSafeNumber(sale.quantity_kg);
    const total = toSafeNumber(sale.total_sales_usd);
    const salesAmount = toSafeNumber(sale.sales);
    const aspTotal = toSafeNumber(sale.asp_total_usd);

    // Calculate weighted ASP contribution (ASP * quantity)
    const weightedAsp = aspTotal * qty;

    if (existing) {
      existing.quantity_kg += qty;
      existing.total_sales_usd += total;
      existing.sales += salesAmount;
      existing.asp_total_usd += weightedAsp; // Sum weighted ASPs
      existing.entry_count += 1;

      if (saleTime < new Date(existing.first_date).getTime()) {
        existing.first_date = sale.sale_date;
      }
      if (saleTime > new Date(existing.last_date).getTime()) {
        existing.last_date = sale.sale_date;
      }
    } else {
      map.set(key, {
        key,
        product_id: sale.product_id,
        product_name: sale.product?.name ?? "—",
        market: sale.market,
        sales: salesAmount,
        asp_total_usd: weightedAsp, // Initialize with weighted ASP
        quantity_kg: qty,
        total_sales_usd: total,
        first_date: sale.sale_date,
        last_date: sale.sale_date,
        entry_count: 1,
      });
    }
  }

  // Recompute weighted-average ASP from summed weighted ASPs / total quantity
  for (const row of map.values()) {
    row.asp_total_usd =
      row.quantity_kg > 0 ? row.asp_total_usd / row.quantity_kg : 0;
  }

  return Array.from(map.values()).sort((a, b) =>
    a.product_name.localeCompare(b.product_name),
  );
}

// Format the date column: a single date if all entries fall on one day,
// or a "first – last" range if the product has sales across multiple days.
function formatDateRange(row: GroupedRow) {
  const first = parseLocalDate(row.first_date).toLocaleDateString();
  const last = parseLocalDate(row.last_date).toLocaleDateString();
  return first === last ? first : `${first} – ${last}`;
}

// ─── Component ─────────────────────────────────────────

export default function SalesDash({ initialData }: SalesDashProps) {
  const role = useRole();
  const allowedTabs = getAllowedTabs(role);

  const [tab, setTab] = useState<Tab>("view");

  // ── Stores ───────────────────────────────────────────
  const {
    products,
    loading: productsLoading,
    fetchProducts,
  } = useProductsStore();

  const {
    sales,
    summary,
    dateRange,
    loading: salesLoading,
    fetchAll,
    setDateRange,
    setSalesData,
  } = useSalesStore();

  // ─────────────────────────────────────────────────────
  // 1. HYDRATION (ONLY ONCE, ONLY FROM ROUTE)
  // ─────────────────────────────────────────────────────
  const initDone = useRef(false);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    if (initialData) {
      setSalesData(
        initialData.sales,
        initialData.summary,
        initialData.dateRange,
      );
    } else {
      setDateRange(getCurrentMonthRange());
    }
  }, [initialData, setSalesData, setDateRange]);

  // ─────────────────────────────────────────────────────
  // 2. PRODUCTS (SINGLE SOURCE FETCH)
  // ─────────────────────────────────────────────────────
  const productsFetched = useRef(false);

  useEffect(() => {
    if (productsFetched.current) return;
    productsFetched.current = true;
    fetchProducts();
  }, [fetchProducts]);

  // ─────────────────────────────────────────────────────
  // 3. DATE PICKER LOCAL STATE
  // ─────────────────────────────────────────────────────
  const [from, setFrom] = useState<Date | undefined>(
    dateRange.from ? parseLocalDate(dateRange.from) : undefined,
  );

  const [to, setTo] = useState<Date | undefined>(
    dateRange.to ? parseLocalDate(dateRange.to) : undefined,
  );

  useEffect(() => {
    setFrom(dateRange.from ? parseLocalDate(dateRange.from) : undefined);
    setTo(dateRange.to ? parseLocalDate(dateRange.to) : undefined);
  }, [dateRange]);

  // ─────────────────────────────────────────────────────
  // 4. FILTER ACTIONS
  // ─────────────────────────────────────────────────────
  function handleFilter() {
    setDateRange({
      from: from ? formatLocalDate(from) : null,
      to: to ? formatLocalDate(to) : null,
    });
  }

  function handleClearFilter() {
    setFrom(undefined);
    setTo(undefined);
    setDateRange(getCurrentMonthRange());
  }

  // ─────────────────────────────────────────────────────
  // 5. DERIVED STATE
  // ─────────────────────────────────────────────────────
  const loading = productsLoading || salesLoading;

  const {
    total_sales_usd,
    total_quantity_kg,
    asp_total_usd,
    export_count,
    local_count,
  } = summary;

  // Group raw sales into one row per product, qty/sales summed,
  // ASP recomputed as a weighted average from the original data
  const groupedRows = useMemo(() => groupSales(sales), [sales]);

  // ─────────────────────────────────────────────────────
  // 6. RENDER
  // ─────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted w-fit">
        {(["view", "input"] as Tab[])
          .filter((t) => allowedTabs.includes(t))
          .map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium capitalize",
                tab === t
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t === "view" && <BarChart2 className="h-3.5 w-3.5" />}
              {t === "input" && <PlusCircle className="h-3.5 w-3.5" />}
              {t}
            </button>
          ))}
      </div>

      {/* ── VIEW TAB ───────────────────────────── */}
      {tab === "view" && (
        <div className="space-y-4">
          {/* Date filter */}
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <p className="text-xs text-muted-foreground">From</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[240px] h-9 justify-start"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {from ? format(from, "PPP") : "Select start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0">
                  <Calendar mode="single" selected={from} onSelect={setFrom} />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">To</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[240px] h-9 justify-start"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {to ? format(to, "PPP") : "Select end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0">
                  <Calendar
                    mode="single"
                    selected={to}
                    onSelect={setTo}
                    disabled={from ? { before: from } : undefined}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button onClick={handleFilter} className="h-9">
              Filter
            </Button>

            {(dateRange.from || dateRange.to) && (
              <Button
                variant="outline"
                onClick={handleClearFilter}
                className="h-9"
              >
                Clear
              </Button>
            )}
          </div>

          {/* Summary */}
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    Total Sales (USD)
                  </p>
                  <p className="text-xl font-semibold">
                    {fmtUSD(total_sales_usd)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    Total Volume (Kg)
                  </p>
                  <p className="text-2xl font-semibold">
                    {fmt(total_quantity_kg)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-1">ASP</p>
                  <p className="text-2xl font-semibold">
                    {fmtUSD(asp_total_usd)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    Export lines
                  </p>
                  <p className="text-2xl font-semibold">{export_count}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    Local lines
                  </p>
                  <p className="text-2xl font-semibold">{local_count}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Table */}
          <Card>
            <CardContent className="pt-4">
              {loading ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Market</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Sales</TableHead>
                      <TableHead className="text-right">ASP</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-4 w-32" />
                        </TableCell>

                        <TableCell>
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </TableCell>

                        <TableCell className="text-right">
                          <Skeleton className="h-4 w-16 ml-auto" />
                        </TableCell>

                        <TableCell className="text-right">
                          <Skeleton className="h-4 w-16 ml-auto" />
                        </TableCell>

                        <TableCell className="text-right">
                          <Skeleton className="h-4 w-20 ml-auto" />
                        </TableCell>

                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : groupedRows.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No sales found for this period.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Market</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Sales</TableHead>
                      <TableHead className="text-right">ASP</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {groupedRows.map((row) => (
                      <TableRow key={row.key}>
                        <TableCell>
                          {row.product_name}
                          {row.entry_count > 1 && (
                            <span className="ml-1.5 text-xs text-muted-foreground">
                              ({row.entry_count} entries)
                            </span>
                          )}
                        </TableCell>

                        <TableCell>
                          <Badge>{row.market}</Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          {fmt(row.quantity_kg)}
                        </TableCell>

                        <TableCell className="text-right">
                          {fmtUSD(row.sales)}
                        </TableCell>

                        <TableCell className="text-right">
                          {fmtUSD(row.asp_total_usd)}
                        </TableCell>

                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {formatDateRange(row)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── INPUT TAB ───────────────────────────── */}
      {tab === "input" && (
        <SalesInputForm
          products={products}
          loading={productsLoading}
          onSaved={() =>
            fetchAll(dateRange.from ?? undefined, dateRange.to ?? undefined)
          }
        />
      )}
    </div>
  );
}
