"use client";

import { useState, useEffect, useRef } from "react";
import {
  BarChart2, PlusCircle, TrendingUp, TrendingDown,
  DollarSign, Package, Truck, Globe,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useProductsStore } from "@/store/products.store";
import { useTradingStore } from "@/store/trading.store";
import TradingInputForm from "../-forms/trading-input-form";
import { mockData } from "@/routes/auth/-data/-mock-data";

// ── Types ────────────────────────────────────────────────────────────────────

type Tab = "view" | "input";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString();
}

function fmtNumber(n: number, decimals: number = 2) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function getMarketBadge(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("local")) return <Badge variant="outline">Local</Badge>;
  if (lower.includes("cwc") || lower.includes("dc on-trade")) return (
    <Badge variant="outline" className="border-amber-400 text-amber-700 bg-amber-50">CWC</Badge>
  );
  return <Badge variant="default">Export</Badge>;
}

// ── Derived mock summary from mockData.trading ────────────────────────────────

function computeSummary(items: typeof mockData.trading) {
  const total_volume_in = items.reduce((s, t) => s + t.volumeIn, 0);
  const total_volume_out = items.reduce((s, t) => s + t.volumeOut, 0);
  const total_orders = items.length;
  const export_orders = items.filter((t) => {
    const n = t.name.toLowerCase();
    return !n.includes("local") && !n.includes("cwc") && !n.includes("dc on-trade");
  }).length;
  const local_orders = items.filter((t) => t.name.toLowerCase().includes("local")).length;
  const cwc_orders = items.filter((t) => {
    const n = t.name.toLowerCase();
    return n.includes("cwc") || n.includes("dc on-trade");
  }).length;
  return { total_volume_in, total_volume_out, total_orders, export_orders, local_orders, cwc_orders };
}

// ── Main component ───────────────────────────────────────────────────────────

export default function TradingDash() {
  const [tab, setTab] = useState<Tab>("view");

  // Input tab still uses the real store for products + saving
  const { products, loading: productsLoading, fetchProducts } = useProductsStore();
  const productsFetched = useRef(false);
  useEffect(() => {
    if (!productsFetched.current) {
      productsFetched.current = true;
      fetchProducts();
    }
  }, [fetchProducts]);

  const { dateRange, fetchLatest } = useTradingStore();

  // View tab: client-side name filter over mock trading data
  const [search, ] = useState("");

  const visibleTrades = search.trim()
    ? mockData.trading.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.input.toLowerCase().includes(search.toLowerCase()) ||
        t.output.toLowerCase().includes(search.toLowerCase())
      )
    : mockData.trading;

  const summary = computeSummary(visibleTrades);

  const stats = [
    {
      label: "Total Entries",
      value: fmt(summary.total_orders),
      icon: Truck,
      trend: "neutral",
      sub: "transactions",
    },
    {
      label: "Volume In",
      value: fmtNumber(summary.total_volume_in / 1000, 2) + " MT",
      icon: Package,
      trend: "neutral",
      sub: `${fmt(summary.total_volume_in)} kg`,
    },
    {
      label: "Volume Out",
      value: fmtNumber(summary.total_volume_out / 1000, 2) + " MT",
      icon: TrendingUp,
      trend: "positive",
      sub: `${fmt(summary.total_volume_out)} kg`,
    },
    {
      label: "Export",
      value: fmt(summary.export_orders),
      icon: Globe,
      trend: "positive",
      sub: "international",
    },
    {
      label: "Local",
      value: fmt(summary.local_orders),
      icon: TrendingDown,
      trend: "neutral",
      sub: "domestic",
    },
    {
      label: "CWC",
      value: fmt(summary.cwc_orders),
      icon: DollarSign,
      trend: "neutral",
      sub: "on-trade / tolling",
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

      {/* ── VIEW TAB — mockData.trading ── */}
      {tab === "view" && (
        <div className="space-y-4">

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
          <Card>
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold">Trade Name</TableHead>
                      <TableHead className="font-semibold">Input</TableHead>
                      <TableHead className="font-semibold">Output</TableHead>
                      <TableHead className="font-semibold">Market</TableHead>
                      <TableHead className="text-right font-semibold">Vol In (kg)</TableHead>
                      <TableHead className="text-right font-semibold">Vol In (MT)</TableHead>
                      <TableHead className="text-right font-semibold">Vol Out (kg)</TableHead>
                      <TableHead className="text-right font-semibold">Vol Out (MT)</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {visibleTrades.map((trade) => (
                      <TableRow key={trade.name}>
                        <TableCell className="font-medium">{trade.name}</TableCell>
                        <TableCell className="text-muted-foreground">{trade.input}</TableCell>
                        <TableCell className="text-muted-foreground">{trade.output}</TableCell>
                        <TableCell>{getMarketBadge(trade.name)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {trade.volumeIn > 0 ? fmt(trade.volumeIn) : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {trade.volumeIn > 0 ? fmtNumber(trade.volumeIn / 1000, 2) : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {trade.volumeOut > 0 ? fmt(trade.volumeOut) : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {trade.volumeOut > 0 ? fmtNumber(trade.volumeOut / 1000, 2) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* Totals row */}
                    <TableRow className="border-t-2 bg-muted/30">
                      <TableCell colSpan={4} className="font-semibold">Total</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {fmt(summary.total_volume_in)}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {fmtNumber(summary.total_volume_in / 1000, 2)}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {fmt(summary.total_volume_out)}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {fmtNumber(summary.total_volume_out / 1000, 2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── INPUT TAB — real store ── */}
      {tab === "input" && (
        <TradingInputForm
          products={products.filter((p) => p.is_active)}
          loading={productsLoading}
          onSaved={() => {
            fetchLatest(dateRange.from ?? undefined, dateRange.to ?? undefined);
            setTab("view");
          }}
        />
      )}
    </div>
  );
}