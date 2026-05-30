"use client";

import { useEffect, useMemo, useState } from "react";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

import { Skeleton } from "@/components/ui/skeleton";

import { TrendingUp, TrendingDown, BarChart2, PlusCircle } from "lucide-react";

import EnergyInputForm from "../-forms/energy-input-form";
import { energyService } from "@/services/energy.service";
import { EnergyRecord } from "@/types/energy.types";

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */

function fmt(n: number) {
  return Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtPHP(n: number) {
  return (
    "₱" +
    Number(n || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function formatMonth(date: string) {
  try {
    return new Date(date).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
    });
  } catch {
    return date;
  }
}

/* ─────────────────────────────────────────────
   CHART CONFIG
───────────────────────────────────────────── */

const chartConfig = {
  account2: {
    label: "Account 2",
    color: "var(--chart-1)",
  },
  account3: {
    label: "Account 3",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */

interface MonthlyRow {
  month: string;

  account2_kw: number;
  account2_demand: number;
  account2_billed: number;

  account3_kw: number;
  account3_demand: number;
  account3_billed: number;
}

/* ─────────────────────────────────────────────
   SKELETON COMPONENTS
───────────────────────────────────────────── */

function TileSkeleton() {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <Skeleton className="h-3 w-16 mb-2" />
        <Skeleton className="h-8 w-28 mb-1" />
        <Skeleton className="h-3 w-20 mb-3" />
        <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-3">
          <div>
            <Skeleton className="h-3 w-16 mb-1" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div>
            <Skeleton className="h-3 w-20 mb-1" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Skeleton className="h-6 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-40 mb-2" />
        <Skeleton className="h-3 w-56" />
      </CardHeader>
      <CardContent className="px-2 pt-2 sm:px-6">
        <div className="aspect-auto h-[220px] w-full flex items-center justify-center">
          <Skeleton className="h-full w-full rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-3 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Table header skeleton */}
          <div className="flex gap-4 border-b pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16 ml-auto" />
            <Skeleton className="h-4 w-16 ml-auto" />
            <Skeleton className="h-4 w-16 ml-auto" />
            <Skeleton className="h-4 w-16 ml-auto" />
            <Skeleton className="h-4 w-16 ml-auto" />
          </div>
          {/* Table body skeletons */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 py-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16 ml-auto" />
              <Skeleton className="h-4 w-20 ml-auto" />
              <Skeleton className="h-4 w-16 ml-auto" />
              <Skeleton className="h-4 w-20 ml-auto" />
              <Skeleton className="h-4 w-20 ml-auto" />
            </div>
          ))}
          {/* Footer skeleton */}
          <div className="flex gap-4 pt-2 border-t">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-16 ml-auto" />
            <Skeleton className="h-4 w-20 ml-auto" />
            <Skeleton className="h-4 w-16 ml-auto" />
            <Skeleton className="h-4 w-20 ml-auto" />
            <Skeleton className="h-4 w-20 ml-auto" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─────────────────────────────────────────────
   VIEW TAB
───────────────────────────────────────────── */

function EnergyView({ refreshKey }: { refreshKey: number }) {
  const [account2, setAccount2] = useState<EnergyRecord[]>([]);
  const [account3, setAccount3] = useState<EnergyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      try {
        const res = await energyService.getAll();

        setAccount2(res.data.account2 ?? []);
        setAccount3(res.data.account3 ?? []);
      } catch (error) {
        console.error("Failed loading energy data", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [refreshKey]);

  /* ─────────────────────────────────────────
     MERGE DATA BY MONTH
  ───────────────────────────────────────── */

  const monthlyRows = useMemo<MonthlyRow[]>(() => {
    const map = new Map<string, MonthlyRow>();

    [...account2, ...account3].forEach((record) => {
      const month = record.billing_month;

      if (!map.has(month)) {
        map.set(month, {
          month,

          account2_kw: 0,
          account2_demand: 0,
          account2_billed: 0,

          account3_kw: 0,
          account3_demand: 0,
          account3_billed: 0,
        });
      }

      const row = map.get(month)!;

      if (record.account === "account2") {
        row.account2_kw += Number(record.kw);
        row.account2_demand += Number(record.demand);
        row.account2_billed += Number(record.billed_amount);
      }

      if (record.account === "account3") {
        row.account3_kw += Number(record.kw);
        row.account3_demand += Number(record.demand);
        row.account3_billed += Number(record.billed_amount);
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.month.localeCompare(b.month),
    );
  }, [account2, account3]);

  /* ─────────────────────────────────────────
     CHART DATA
  ───────────────────────────────────────── */

  const chartData = monthlyRows.map((row) => ({
    month: formatMonth(row.month),
    account2: row.account2_billed,
    account3: row.account3_billed,
  }));

  /* ─────────────────────────────────────────
     TOTALS
  ───────────────────────────────────────── */

  const totalBilled2 = monthlyRows.reduce(
    (sum, row) => sum + row.account2_billed,
    0,
  );

  const totalBilled3 = monthlyRows.reduce(
    (sum, row) => sum + row.account3_billed,
    0,
  );

  const grandTotal = totalBilled2 + totalBilled3;

  const totalKw2 = monthlyRows.reduce((sum, row) => sum + row.account2_kw, 0);

  const totalKw3 = monthlyRows.reduce((sum, row) => sum + row.account3_kw, 0);

  const totalDemand2 = monthlyRows.reduce(
    (sum, row) => sum + row.account2_demand,
    0,
  );

  const totalDemand3 = monthlyRows.reduce(
    (sum, row) => sum + row.account3_demand,
    0,
  );

  /* ─────────────────────────────────────────
     TRENDS
  ───────────────────────────────────────── */

  const latestMonth =
    monthlyRows.length > 0 ? monthlyRows[monthlyRows.length - 1] : null;

  const prevMonth =
    monthlyRows.length > 1 ? monthlyRows[monthlyRows.length - 2] : null;

  const accountTiles = [
    {
      label: "Account 2",
      billed: totalBilled2,
      kw: totalKw2,
      demand: totalDemand2,
      latest: latestMonth?.account2_billed ?? 0,
      prev: prevMonth?.account2_billed ?? 0,
    },
    {
      label: "Account 3",
      billed: totalBilled3,
      kw: totalKw3,
      demand: totalDemand3,
      latest: latestMonth?.account3_billed ?? 0,
      prev: prevMonth?.account3_billed ?? 0,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Tile skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <TileSkeleton />
          <TileSkeleton />
        </div>
        {/* Chart skeleton */}
        <ChartSkeleton />
        {/* Table skeleton */}
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ───────────────── tiles ───────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {accountTiles.map((a) => {
          const diff = a.latest - a.prev;

          const pct = a.prev > 0 ? ((diff / a.prev) * 100).toFixed(1) : "0.0";

          const isPositive = diff >= 0;

          return (
            <Card key={a.label}>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground mb-2">{a.label}</p>

                <p className="text-2xl font-bold tracking-tight">
                  {fmtPHP(a.billed)}
                </p>

                <p className="text-xs text-muted-foreground">total billed</p>

                <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Total kW</p>

                    <p className="text-xs font-medium">{fmt(a.kw)}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Total Demand
                    </p>

                    <p className="text-xs font-medium">{fmt(a.demand)}</p>
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <div
                    className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md ${
                      isPositive
                        ? "bg-rose-500/10 text-rose-600"
                        : "bg-emerald-500/10 text-emerald-600"
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {isPositive ? "+" : ""}
                    {pct}% vs prev
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ───────────────── chart ───────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Monthly Billing Trend
          </CardTitle>

          <CardDescription>
            Account 2 vs Account 3 billed amount
          </CardDescription>
        </CardHeader>

        <CardContent className="px-2 pt-2 sm:px-6">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[220px] w-full"
          >
            <LineChart data={chartData}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />

              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(v) => `₱${fmt(v)}`}
              />

              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(v) => `Month: ${v}`}
                  />
                }
              />

              <Line
                type="monotone"
                dataKey="account2"
                stroke="var(--color-account2)"
                strokeWidth={2}
                dot={{
                  r: 4,
                  fill: "var(--color-account2)",
                }}
                activeDot={{ r: 6 }}
              />

              <Line
                type="monotone"
                dataKey="account3"
                stroke="var(--color-account3)"
                strokeWidth={2}
                dot={{
                  r: 4,
                  fill: "var(--color-account3)",
                }}
                activeDot={{ r: 6 }}
              />

              <ChartLegend content={<ChartLegendContent />} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* ───────────────── table ───────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Monthly Summary</CardTitle>

          <CardDescription>Combined breakdown per month</CardDescription>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead rowSpan={2} className="align-middle border-r">
                  Month
                </TableHead>
                <TableHead
                  colSpan={3}
                  className="text-center border-r border-b-0"
                >
                  Account 2
                </TableHead>
                <TableHead colSpan={3} className="text-center border-b-0">
                  Account 3
                </TableHead>
                <TableHead
                  rowSpan={2}
                  className="text-right align-middle border-l"
                >
                  Total
                </TableHead>
              </TableRow>

              <TableRow>
                {/* Account 2 sub-headers */}
                <TableHead className="text-right">Demand</TableHead>
                <TableHead className="text-right">kW-hr</TableHead>
                <TableHead className="text-right border-r">
                  Billed PHP
                </TableHead>

                {/* Account 3 sub-headers */}
                <TableHead className="text-right">Demand</TableHead>
                <TableHead className="text-right">kW-hr</TableHead>
                <TableHead className="text-right">Billed PHP</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {monthlyRows.map((row) => {
                const total = row.account2_billed + row.account3_billed;
                return (
                  <TableRow key={row.month}>
                    <TableCell className="font-medium border-r">
                      {formatMonth(row.month)}
                    </TableCell>

                    {/* Account 2 */}
                    <TableCell className="text-right tabular-nums">
                      {fmt(row.account2_demand)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmt(row.account2_kw)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums border-r">
                      {fmtPHP(row.account2_billed)}
                    </TableCell>

                    {/* Account 3 */}
                    <TableCell className="text-right tabular-nums">
                      {fmt(row.account3_demand)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmt(row.account3_kw)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtPHP(row.account3_billed)}
                    </TableCell>

                    <TableCell className="text-right tabular-nums font-semibold border-l">
                      {fmtPHP(total)}
                    </TableCell>
                  </TableRow>
                );
              })}

              {/* Totals row */}
              <TableRow className="border-t-2 font-semibold bg-muted/40">
                <TableCell className="border-r">Total</TableCell>

                <TableCell className="text-right tabular-nums">
                  {fmt(totalDemand2)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {fmt(totalKw2)}
                </TableCell>
                <TableCell className="text-right tabular-nums border-r">
                  {fmtPHP(totalBilled2)}
                </TableCell>

                <TableCell className="text-right tabular-nums">
                  {fmt(totalDemand3)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {fmt(totalKw3)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {fmtPHP(totalBilled3)}
                </TableCell>

                <TableCell className="text-right tabular-nums border-l">
                  {fmtPHP(grandTotal)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ROOT DASH
───────────────────────────────────────────── */

type Tab = "view" | "input";

export default function EnergyDash() {
  const [tab, setTab] = useState<Tab>("view");
  const [refreshKey, setRefreshKey] = useState(0);

  function handleSaved() {
    setRefreshKey((k) => k + 1);
    setTab("view");
  }

  return (
    <div className="space-y-4">
      {/* ───────────────── tabs ───────────────── */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted w-fit">
        <button
          onClick={() => setTab("view")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            tab === "view"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BarChart2 className="h-3.5 w-3.5" />
          View
        </button>

        <button
          onClick={() => setTab("input")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            tab === "input"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <PlusCircle className="h-3.5 w-3.5" />
          Input
        </button>
      </div>

      {/* ───────────────── content ───────────────── */}
      {tab === "view" && <EnergyView refreshKey={refreshKey} />}

      {tab === "input" && <EnergyInputForm onSaved={handleSaved} />}
    </div>
  );
}
