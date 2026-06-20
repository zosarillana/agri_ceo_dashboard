// src/routes/auth/-components/-tabs/trading-dash.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { BarChart2, CalendarIcon, PlusCircle, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

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

import { useTradingStore } from "@/store/trading.store";
import { useTradeItemsStore } from "@/store/trade-items.store";
import TradingInputForm from "../-forms/trading-input-form";
import TradingManageItemsForm from "../-forms/trading-manage-items-form";
import { Market } from "@/types/trading.types";

// ─── Types ─────────────────────────────────────────────

type Tab = "view" | "input" | "manage";

// ─── Formatters ────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString();
}

function fmtNumber(n: number, decimals = 2) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function getMarketBadge(market: Market) {
  if (market === "Local") return <Badge variant="outline">Local</Badge>;
  if (market === "CWC")
    return (
      <Badge
        variant="outline"
        className="border-amber-400 text-amber-700 bg-amber-50"
      >
        CWC
      </Badge>
    );
  return <Badge variant="default">Export</Badge>;
}

// ─── Helper ────────────────────────────────────────────

function getCurrentMonthRange() {
  const now = new Date();

  return {
    from: format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyy-MM-dd"),
    to: format(now, "yyyy-MM-dd"),
  };
}

// ─── Component ─────────────────────────────────────────

export default function TradingDash() {
  const [tab, setTab] = useState<Tab>("view");

  // ── Stores ───────────────────────────────────────────
  const {
    trades,
    summary,
    dateRange,
    loading: tradesLoading,
    fetchLatest,
    setDateRange,
    clearError,
    error,
  } = useTradingStore();

  const {
    tradeItems,
    loading: itemsLoading,
    fetchTradeItems,
  } = useTradeItemsStore();

  // ─────────────────────────────────────────────────────
  // 1. INITIAL FETCH
  // ─────────────────────────────────────────────────────
  const initDone = useRef(false);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    // Set default date range if not set
    if (!dateRange.from) {
      setDateRange(getCurrentMonthRange());
    } else {
      fetchLatest(dateRange.from ?? undefined, dateRange.to ?? undefined);
    }

    fetchTradeItems();
  }, []);

  // ─────────────────────────────────────────────────────
  // 2. DATE PICKER LOCAL STATE
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
  // 3. FILTER ACTIONS
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
  // 4. DERIVED STATE
  // ─────────────────────────────────────────────────────
  const loading = tradesLoading || itemsLoading;

  const {
    total_volume,
    total_value,
    total_orders,
    export_orders,
    local_orders,
  } = summary;

  // ─────────────────────────────────────────────────────
  // 5. RENDER
  // ─────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted w-fit">
        {(["view", "input", "manage"] as Tab[]).map((t) => (
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
            {t === "manage" && <Settings className="h-3.5 w-3.5" />}
            {t}
          </button>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between px-4 py-2 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          <span>{error}</span>
          <button
            onClick={clearError}
            className="ml-4 font-medium hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

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
                    className="w-[200px] h-9 justify-start"
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
                    className="w-[200px] h-9 justify-start"
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-4 pb-4">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-6 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    Total Entries
                  </p>
                  <p className="text-xl font-semibold">{fmt(total_orders)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    Total Output Volume
                  </p>
                  <p className="text-xl font-semibold">
                    {fmtNumber(total_volume / 1000, 2)} MT
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {fmt(total_volume)} kg
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    Total Value
                  </p>
                  <p className="text-xl font-semibold">
                    {fmtNumber(total_value, 2)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-1">Export</p>
                  <p className="text-xl font-semibold">{fmt(export_orders)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-1">Local</p>
                  <p className="text-xl font-semibold">{fmt(local_orders)}</p>
                </CardContent>
              </Card>
              {/* <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-1">CWC</p>
                  <p className="text-xl font-semibold">{fmt(cwc_orders)}</p>
                </CardContent>
              </Card> */}
            </div>
          )}

          {/* Table */}
          <Card>
            <CardContent className="pt-4">
              {loading ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trade Name</TableHead>
                      <TableHead>Input Product</TableHead>
                      <TableHead>Output Product</TableHead>
                      <TableHead>Market</TableHead>
                      {/* <TableHead>Counterparty</TableHead> */}
                      <TableHead className="text-right">Input (kg)</TableHead>
                      <TableHead className="text-right">Output (kg)</TableHead>
                      <TableHead className="text-right">Output (MT)</TableHead>
                      {/* <TableHead className="text-right">Total Value</TableHead> */}
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
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
                          <Skeleton className="h-4 w-16 ml-auto" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : trades.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No trades found for the selected period.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Trade Name</TableHead>
                        <TableHead>Input Product</TableHead>
                        <TableHead>Output</TableHead>
                        <TableHead>Market</TableHead>
                        {/* <TableHead>Counterparty</TableHead> */}
                        <TableHead className="text-right">Input (kg)</TableHead>
                        <TableHead className="text-right">Output (kg)</TableHead>
                        <TableHead className="text-right">Input (MT)</TableHead>
                        <TableHead className="text-right">Output (MT)</TableHead>
                        {/* <TableHead className="text-right">
                          Total Value
                        </TableHead> */}
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trades.map((trade) => (
                        <TableRow key={trade.id}>
                          <TableCell className="font-medium">
                            {trade.trade_item?.name ?? "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {trade.trade_item?.input ?? "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {trade.trade_item?.output ?? "—"}
                          </TableCell>
                          <TableCell>{getMarketBadge(trade.market)}</TableCell>
                          {/* <TableCell className="text-muted-foreground">
                            {trade.counterparty ?? "—"}
                          </TableCell> */}
                          <TableCell className="text-right tabular-nums">
                            {trade.input_kg > 0 ? fmt(trade.input_kg) : "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {trade.output_kg > 0 ? fmt(trade.output_kg) : "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {trade.input_kg > 0
                              ? fmtNumber(trade.input_kg / 1000, 2)
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {trade.output_kg > 0
                              ? fmtNumber(trade.output_kg / 1000, 2)
                              : "—"}
                          </TableCell>
                          {/* <TableCell className="text-right tabular-nums">
                            {fmtNumber(trade.total_value, 2)}
                          </TableCell> */}
                          <TableCell className="text-muted-foreground">
                            {new Date(trade.trade_date).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Summary Row
                      <TableRow className="border-t-2 bg-muted/30">
                        <TableCell colSpan={6} className="font-semibold">
                          Total
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {fmt(total_volume)}
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {fmtNumber(total_volume / 1000, 2)}
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {fmtNumber(total_value, 2)}
                        </TableCell>
                        <TableCell />
                      </TableRow> */}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── INPUT TAB ───────────────────────────── */}
      {tab === "input" && (
        <TradingInputForm
          tradeItems={tradeItems}
          loading={itemsLoading}
          onSaved={() => {
            // Refresh with current date range
            fetchLatest(dateRange.from ?? undefined, dateRange.to ?? undefined);
            setTab("view");
          }}
        />
      )}

      {/* ── MANAGE TAB ───────────────────────────── */}
      {tab === "manage" && (
        <TradingManageItemsForm
          onItemsChanged={() => {
            fetchTradeItems();
          }}
        />
      )}
    </div>
  );
}