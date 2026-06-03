// src/routes/auth/.../trading.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import {
  BarChart2, CalendarIcon, PlusCircle, TrendingUp, TrendingDown,
  DollarSign, Package, Truck, Globe,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useProductsStore } from "@/store/products.store";
import { useTradingStore } from "@/store/trading.store";
import TradingInputForm from "../-forms/trading-input-form";

type Tab = "view" | "input";

function fmt(n: number) {
  return n.toLocaleString();
}

function fmtUSD(n: number) {
  return "$" + n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtNumber(n: number, decimals: number = 2) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function ViewSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
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

// ✅ Fixed: now actually returns the Export badge
function getMarketBadge(market: string) {
  if (market === "Export") {
    return <Badge variant="default">Export</Badge>;
  }
  return <Badge variant="outline">Local</Badge>;
}

export default function TradingDash() {
  const [tab, setTab] = useState<Tab>("view");

  const { products, loading: productsLoading, fetchProducts } = useProductsStore();
  const productsFetched = useRef(false);
  useEffect(() => {
    if (!productsFetched.current) {
      productsFetched.current = true;
      fetchProducts();
    }
  }, [fetchProducts]);

  const {
    trades, summary, dateRange, loading: tradesLoading,
    fetchLatest, setDateRange, clearDateRange,
  } = useTradingStore();

  const tradesFetched = useRef(false);
  useEffect(() => {
    if (!tradesFetched.current) {
      tradesFetched.current = true;
      fetchLatest();
    }
  }, [fetchLatest]);

  const [from, setFrom] = useState<Date | undefined>(
    dateRange.from ? new Date(dateRange.from) : undefined,
  );
  const [to, setTo] = useState<Date | undefined>(
    dateRange.to ? new Date(dateRange.to) : undefined,
  );

  useEffect(() => {
    setFrom(dateRange.from ? new Date(dateRange.from) : undefined);
    setTo(dateRange.to ? new Date(dateRange.to) : undefined);
  }, [dateRange.from, dateRange.to]);

  function handleFilter() {
    const fromStr = from ? format(from, "yyyy-MM-dd") : null;
    const toStr = to ? format(to, "yyyy-MM-dd") : null;
    setDateRange({ from: fromStr, to: toStr });
  }

  function handleClearFilter() {
    setFrom(undefined);
    setTo(undefined);
    clearDateRange();
  }

  const loading = productsLoading || tradesLoading;

  const stats = [
    {
      label: "Total Volume (MT)",
      value: fmtNumber(summary.total_volume / 1000, 2),
      icon: Package,
      trend: "neutral",
      sub: `${fmtNumber(summary.total_volume)} kg`,
    },
    {
      label: "Total Value",
      value: fmtUSD(summary.total_value),
      icon: DollarSign,
      trend: "positive",
      sub: "FOB value",
    },
    {
      label: "Avg Price",
      value: fmtUSD(summary.avg_price),
      icon: TrendingUp,
      trend: "positive",
      sub: "per kg",
    },
    {
      label: "Total Orders",
      value: fmt(summary.total_orders),
      icon: Truck,
      trend: "neutral",
      sub: "transactions",
    },
    {
      label: "Export Orders",
      value: fmt(summary.export_orders),
      icon: Globe,
      trend: "positive",
      sub: "international",
    },
    {
      label: "Local Orders",
      value: fmt(summary.local_orders),
      icon: TrendingDown,
      trend: "neutral",
      sub: "domestic",
    },
  ];

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
                  <Calendar mode="single" selected={from} onSelect={setFrom} initialFocus />
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
              <Button size="sm" variant="outline" onClick={handleClearFilter} className="h-9">
                Clear
              </Button>
            )}
          </div>

          {loading ? (
            <ViewSkeleton />
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={stat.label}>
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                            <p className="text-lg font-semibold">{stat.value}</p>
                            <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                          </div>
                          <div className={`p-2 rounded-md ${
                            stat.trend === "positive"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : stat.trend === "negative"
                                ? "bg-rose-500/10 text-rose-500"
                                : "bg-muted text-muted-foreground"
                          }`}>
                            <Icon className="h-4 w-4" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Table */}
              {trades.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-sm text-muted-foreground">
                    {dateRange.from || dateRange.to
                      ? "No trades found for the selected date range."
                      : "No trades recorded yet. Use the Input tab to add trades."}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-4">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="font-semibold">Date</TableHead>
                            <TableHead className="font-semibold">Product</TableHead>
                            <TableHead className="font-semibold">Market</TableHead>
                            <TableHead className="font-semibold">Counterparty</TableHead>
                            <TableHead className="text-right font-semibold">Price $/Kg</TableHead>
                            <TableHead className="text-right font-semibold">Quantity (Kg)</TableHead>
                            <TableHead className="text-right font-semibold">Quantity (MT)</TableHead>
                            <TableHead className="text-right font-semibold">Total Value</TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {trades.map((trade) => (
                            <TableRow key={trade.id}>
                              <TableCell className="font-mono text-sm">
                                {format(new Date(trade.trade_date), "MMM dd, yyyy")}
                              </TableCell>
                              <TableCell className="font-medium">
                                {trade.product?.name ?? `Product #${trade.product_id}`}
                              </TableCell>
                              <TableCell>{getMarketBadge(trade.market)}</TableCell>
                              <TableCell className="max-w-[150px] truncate">
                                {trade.counterparty || "—"}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {fmtUSD(trade.price_per_kg)}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {fmt(trade.quantity_kg)}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {fmtNumber(trade.quantity_kg / 1000, 2)}
                              </TableCell>
                              <TableCell className="text-right font-medium tabular-nums">
                                {fmtUSD(trade.total_value)}
                              </TableCell>
                            </TableRow>
                          ))}

                          {/* Totals row */}
                          <TableRow className="border-t-2 bg-muted/30">
                            <TableCell colSpan={4} className="font-semibold">Total</TableCell>
                            <TableCell className="text-right font-semibold tabular-nums">
                              {fmtUSD(summary.avg_price)}
                            </TableCell>
                            <TableCell className="text-right font-semibold tabular-nums">
                              {fmt(summary.total_volume)}
                            </TableCell>
                            <TableCell className="text-right font-semibold tabular-nums">
                              {fmtNumber(summary.total_volume / 1000, 2)}
                            </TableCell>
                            <TableCell className="text-right font-semibold tabular-nums">
                              {fmtUSD(summary.total_value)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* ── INPUT TAB ── */}
      {tab === "input" && (
        <TradingInputForm
          products={products.filter((p) => p.is_active)}
          loading={productsLoading}
          onSaved={() => {
            const { from, to } = dateRange;
            fetchLatest(from ?? undefined, to ?? undefined);
            setTab("view");
          }}
        />
      )}
    </div>
  );
}