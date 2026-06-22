// src/routes/auth/-components/-tabs/trading-dash.tsx

"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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

import { useRole } from "@/hooks/use-role";
import { getAllowedTabs, type Tab } from "@/lib/permissions";

// ─── Local tab type for this module (subset of the shared Tab) ────────────────
type TradingTab = Extract<Tab, "view" | "input" | "manage">;
const TRADING_TABS: TradingTab[] = ["view", "input", "manage"];

// Aggregated row: one trade_item, kg summed across every trade for
// that item within the currently filtered date range.
type GroupedRow = {
  key: string;
  trade_item_id: number | string | null;
  name: string;
  input: string;
  output: string;
  market: Market;
  input_kg: number;
  output_kg: number;
  first_date: string;
  last_date: string;
  entry_count: number;
};

// ─── Formatters ────────────────────────────────────────

// Safely coerce any incoming value (string, number, null, malformed string)
// to a finite number. Falls back to 0 instead of producing NaN.
function toSafeNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function fmt(n: number) {
  return toSafeNumber(n).toLocaleString();
}

function fmtNumber(n: number, decimals = 2) {
  return toSafeNumber(n).toLocaleString(undefined, {
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

// Group raw trades by trade_item only (NOT by date) and sum kg fields
// across every trade for that item in the currently filtered range.
// Falls back to trade_item name if id isn't present.
function groupTrades(trades: any[]): GroupedRow[] {
  const map = new Map<string, GroupedRow>();

  for (const trade of trades) {
    const itemKey = trade.trade_item_id ?? trade.trade_item?.name ?? "unknown";
    const key = String(itemKey);

    const existing = map.get(key);
    const tradeTime = new Date(trade.trade_date).getTime();

    if (existing) {
      existing.input_kg += toSafeNumber(trade.input_kg);
      existing.output_kg += toSafeNumber(trade.output_kg);
      existing.entry_count += 1;

      if (tradeTime < new Date(existing.first_date).getTime()) {
        existing.first_date = trade.trade_date;
      }
      if (tradeTime > new Date(existing.last_date).getTime()) {
        existing.last_date = trade.trade_date;
      }
    } else {
      map.set(key, {
        key,
        trade_item_id: trade.trade_item_id ?? null,
        name: trade.trade_item?.name ?? "—",
        input: trade.trade_item?.input ?? "—",
        output: trade.trade_item?.output ?? "—",
        market: trade.market,
        input_kg: toSafeNumber(trade.input_kg),
        output_kg: toSafeNumber(trade.output_kg),
        first_date: trade.trade_date,
        last_date: trade.trade_date,
        entry_count: 1,
      });
    }
  }

  // Stable order by name
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

// Format the date column: a single date if all entries fall on one day,
// or a "first – last" range if the item has trades across multiple days.
function formatDateRange(row: GroupedRow) {
  const first = new Date(row.first_date).toLocaleDateString();
  const last = new Date(row.last_date).toLocaleDateString();
  return first === last ? first : `${first} – ${last}`;
}

// ─── Component ─────────────────────────────────────────

export default function TradingDash() {
  const role = useRole();
  const allowedTabs = getAllowedTabs(role, "trading");

  // Only tabs this module supports AND that the role is allowed to see
  const visibleTabs = TRADING_TABS.filter((t) => allowedTabs.includes(t));

  const [tab, setTab] = useState<TradingTab>(
    visibleTabs.includes("view") ? "view" : (visibleTabs[0] ?? "view"),
  );

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

  // Backend summary values, defensively coerced (orders/export/local
  // were displaying correctly, so we still trust those from the API).
  const total_orders = toSafeNumber(summary?.total_orders);
  const export_orders = toSafeNumber(summary?.export_orders);
  const local_orders = toSafeNumber(summary?.local_orders);

  // Group raw trades into one row per trade_item, kg summed.
  const groupedRows = useMemo(() => groupTrades(trades), [trades]);

  // Input/output volume are derived directly from the visible table rows
  // rather than trusted from summary.* — the backend aggregate was
  // returning 0 / malformed values that didn't match the actual trades
  // being shown, so this guarantees the tiles always agree with the table.
  const computedInputKg = useMemo(
    () => groupedRows.reduce((sum, row) => sum + row.input_kg, 0),
    [groupedRows],
  );

  const computedOutputKg = useMemo(
    () => groupedRows.reduce((sum, row) => sum + row.output_kg, 0),
    [groupedRows],
  );

  // ─────────────────────────────────────────────────────
  // 5. RENDER
  // ─────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted w-fit">
        {visibleTabs.map((t) => (
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
      {tab === "view" && allowedTabs.includes("view") && (
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
                    Total Input Volume
                  </p>
                  <p className="text-xl font-semibold">
                    {fmtNumber(computedInputKg / 1000, 2)} MT
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {fmt(computedInputKg)} kg
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    Total Output Volume
                  </p>
                  <p className="text-xl font-semibold">
                    {fmtNumber(computedOutputKg / 1000, 2)} MT
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {fmt(computedOutputKg)} kg
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
                      <TableHead className="text-right">Input (kg)</TableHead>
                      <TableHead className="text-right">Output (kg)</TableHead>
                      <TableHead className="text-right">Output (MT)</TableHead>
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
              ) : groupedRows.length === 0 ? (
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
                        <TableHead className="text-right">Input (kg)</TableHead>
                        <TableHead className="text-right">Output (kg)</TableHead>
                        <TableHead className="text-right">Input (MT)</TableHead>
                        <TableHead className="text-right">Output (MT)</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedRows.map((row) => (
                        <TableRow key={row.key}>
                          <TableCell className="font-medium">
                            {row.name}
                            {row.entry_count > 1 && (
                              <span className="ml-1.5 text-xs text-muted-foreground">
                                ({row.entry_count} entries)
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {row.input}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {row.output}
                          </TableCell>
                          <TableCell>{getMarketBadge(row.market)}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.input_kg > 0 ? fmt(row.input_kg) : "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.output_kg > 0 ? fmt(row.output_kg) : "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.input_kg > 0
                              ? fmtNumber(row.input_kg / 1000, 2)
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.output_kg > 0
                              ? fmtNumber(row.output_kg / 1000, 2)
                              : "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap">
                            {formatDateRange(row)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── INPUT TAB ───────────────────────────── */}
      {tab === "input" && allowedTabs.includes("input") && (
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
      {tab === "manage" && allowedTabs.includes("manage") && (
        <TradingManageItemsForm
          onItemsChanged={() => {
            fetchTradeItems();
          }}
        />
      )}
    </div>
  );
}