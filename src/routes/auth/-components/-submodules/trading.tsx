// src/routes/auth/-components/-tabs/trading-dash.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import {
  BarChart2, PlusCircle, TrendingUp, TrendingDown,
  DollarSign, Package, Truck, Globe, Settings,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useTradingStore } from "@/store/trading.store";
import { useTradeItemsStore } from "@/store/trade-items.store";
import TradingInputForm from "../-forms/trading-input-form";
import TradingManageItemsForm from "../-forms/trading-manage-items-form";
import { Trade, Market } from "@/types/trading.types";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "view" | "input" | "manage";

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  if (market === "CWC") return (
    <Badge variant="outline" className="border-amber-400 text-amber-700 bg-amber-50">CWC</Badge>
  );
  return <Badge variant="default">Export</Badge>;
}

function computeSummary(trades: Trade[]) {
  const total_volume  = trades.reduce((s, t) => s + t.quantity_kg, 0);
  const total_value   = trades.reduce((s, t) => s + t.total_value, 0);
  const total_orders  = trades.length;
  const export_orders = trades.filter((t) => t.market === "Export").length;
  const local_orders  = trades.filter((t) => t.market === "Local").length;
  const cwc_orders    = trades.filter((t) => t.market === "CWC").length;
  const avg_price     = total_volume > 0 ? total_value / total_volume : 0;
  return { total_volume, total_value, avg_price, total_orders, export_orders, local_orders, cwc_orders };
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function TradingDash() {
  const [tab, setTab] = useState<Tab>("view");

  const {
    trades, loading, saving, error, dateRange, fetchLatest, clearError,
  } = useTradingStore();

  const {
    tradeItems, loading: tradeItemsLoading, fetchTradeItems,
  } = useTradeItemsStore();

  const fetched = useRef(false);
  useEffect(() => {
    if (!fetched.current) {
      fetched.current = true;
      fetchLatest();
      fetchTradeItems();
    }
  }, [fetchLatest, fetchTradeItems]);

  const summary = computeSummary(trades);

  const stats = [
    { label: "Total Entries", value: fmt(summary.total_orders),                          icon: Truck,       trend: "neutral",  sub: "transactions"      },
    { label: "Total Volume",  value: fmtNumber(summary.total_volume / 1000, 2) + " MT",  icon: Package,     trend: "neutral",  sub: `${fmt(summary.total_volume)} kg` },
    { label: "Total Value",   value: fmtNumber(summary.total_value, 2),                  icon: TrendingUp,  trend: "positive", sub: "price × qty"       },
    { label: "Export",        value: fmt(summary.export_orders),                          icon: Globe,       trend: "positive", sub: "international"     },
    { label: "Local",         value: fmt(summary.local_orders),                           icon: TrendingDown,trend: "neutral",  sub: "domestic"          },
    { label: "CWC",           value: fmt(summary.cwc_orders),                             icon: DollarSign,  trend: "neutral",  sub: "on-trade / tolling"},
  ];

  const tabs = [
    { key: "view",   label: "View",   icon: BarChart2  },
    { key: "input",  label: "Input",  icon: PlusCircle },
    { key: "manage", label: "Manage", icon: Settings   },
  ] as const;

  return (
    <div className="space-y-4">

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${
              tab === key
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between px-4 py-2 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          <span>{error}</span>
          <button onClick={clearError} className="ml-4 font-medium hover:underline">Dismiss</button>
        </div>
      )}

      {/* ── VIEW TAB ── */}
      {tab === "view" && (
        <div className="space-y-4">
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
                        stat.trend === "positive" ? "bg-emerald-500/10 text-emerald-500"
                        : stat.trend === "negative" ? "bg-rose-500/10 text-rose-500"
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

          <Card>
            <CardContent className="pt-4">
              {loading ? (
                <div className="py-12 text-center text-sm text-muted-foreground">Loading trades…</div>
              ) : trades.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No trades found. Use the Input tab to add trades.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold">Trade Name</TableHead>
                        <TableHead className="font-semibold">Input</TableHead>
                        <TableHead className="font-semibold">Output</TableHead>
                        <TableHead className="font-semibold">Market</TableHead>
                        <TableHead className="font-semibold">Counterparty</TableHead>
                        <TableHead className="text-right font-semibold">Price / kg</TableHead>
                        <TableHead className="text-right font-semibold">Vol (kg)</TableHead>
                        <TableHead className="text-right font-semibold">Vol (MT)</TableHead>
                        <TableHead className="text-right font-semibold">Total Value</TableHead>
                        <TableHead className="font-semibold">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trades.map((trade) => (
                        <TableRow key={trade.id}>
                          <TableCell className="font-medium">{trade.trade_item?.name ?? "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{trade.trade_item?.input ?? "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{trade.trade_item?.output ?? "—"}</TableCell>
                          <TableCell>{getMarketBadge(trade.market)}</TableCell>
                          <TableCell className="text-muted-foreground">{trade.counterparty ?? "—"}</TableCell>
                          <TableCell className="text-right tabular-nums">{fmtNumber(trade.price_per_kg, 4)}</TableCell>
                          <TableCell className="text-right tabular-nums">{trade.quantity_kg > 0 ? fmt(trade.quantity_kg) : "—"}</TableCell>
                          <TableCell className="text-right tabular-nums">{trade.quantity_kg > 0 ? fmtNumber(trade.quantity_kg / 1000, 2) : "—"}</TableCell>
                          <TableCell className="text-right tabular-nums">{fmtNumber(trade.total_value, 2)}</TableCell>
                          <TableCell className="text-muted-foreground">{trade.trade_date}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="border-t-2 bg-muted/30">
                        <TableCell colSpan={6} className="font-semibold">Total</TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">{fmt(summary.total_volume)}</TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">{fmtNumber(summary.total_volume / 1000, 2)}</TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">{fmtNumber(summary.total_value, 2)}</TableCell>
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── INPUT TAB ── */}
      {tab === "input" && (
        <TradingInputForm
          tradeItems={tradeItems}
          loading={tradeItemsLoading || saving}
          onSaved={() => {
            fetchLatest(dateRange.from ?? undefined, dateRange.to ?? undefined);
            setTab("view");
          }}
        />
      )}

      {/* ── MANAGE TAB ── */}
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