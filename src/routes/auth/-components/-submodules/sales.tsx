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

// ─── Types ─────────────────────────────────────────────

type Tab = "view" | "input";

interface SalesDashProps {
  initialData?: {
    sales: Sale[];
    summary: SalesSummary;
    dateRange: { from: string; to: string };
  };
}

// ─── Formatters ────────────────────────────────────────

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

// ─── Month helper ───────────────────────────────────────

function getCurrentMonthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    from: format(from, "yyyy-MM-dd"),
    to: format(to, "yyyy-MM-dd"),
  };
}

// ─── Component ─────────────────────────────────────────

export default function SalesDash({ initialData }: SalesDashProps) {
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
    dateRange.from ? new Date(dateRange.from) : undefined,
  );

  const [to, setTo] = useState<Date | undefined>(
    dateRange.to ? new Date(dateRange.to) : undefined,
  );

  useEffect(() => {
    setFrom(dateRange.from ? new Date(dateRange.from) : undefined);
    setTo(dateRange.to ? new Date(dateRange.to) : undefined);
  }, [dateRange]);

  // ─────────────────────────────────────────────────────
  // 4. FILTER ACTIONS
  // ─────────────────────────────────────────────────────
  function handleFilter() {
    setDateRange({
      from: from ? format(from, "yyyy-MM-dd") : null,
      to: to ? format(to, "yyyy-MM-dd") : null,
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

  const { total_sales_usd, total_quantity_kg, export_count, local_count } =
    summary;

  // ─────────────────────────────────────────────────────
  // 6. RENDER
  // ─────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted w-fit">
        {(["view", "input"] as Tab[]).map((t) => (
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                      <TableHead className="text-right">ASP</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Total</TableHead>
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : sales.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No sales found for this period.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Market</TableHead>
                      <TableHead className="text-right">ASP</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {sales.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>{s.product?.name}</TableCell>

                        <TableCell>
                          <Badge>{s.market}</Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          {fmtUSD(Number(s.asp_per_kg))}
                        </TableCell>

                        <TableCell className="text-right">
                          {fmt(Number(s.quantity_kg))}
                        </TableCell>

                        <TableCell className="text-right">
                          {fmtUSD(Number(s.total_sales_usd))}
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
