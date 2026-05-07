"use client";

import {
  Line, LineChart, CartesianGrid, XAxis, YAxis,
} from "recharts";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
  ChartLegend, ChartLegendContent, type ChartConfig,
} from "@/components/ui/chart";
import { TrendingUp, TrendingDown } from "lucide-react";
import { mockData } from "@/routes/auth/admin/_layout/dashboard/data/-mock-data";

function fmt(n: number) { return n.toLocaleString(); }
function fmtPHP(n: number) {
  return "₱" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const chartConfig = {
  account2: { label: "Account 2", color: "var(--chart-1)" },
  account3: { label: "Account 3", color: "var(--chart-2)" },
} satisfies ChartConfig;

export default function EnergyDash() {
  const { account2, account3 } = mockData.energy;

  const chartData = account2.map((a2, i) => ({
    month: a2.month,
    account2: a2.billedAmount,
    account3: account3[i].billedAmount,
  }));

  const totalBilled2 = account2.reduce((s, r) => s + r.billedAmount, 0);
  const totalBilled3 = account3.reduce((s, r) => s + r.billedAmount, 0);
  const grandTotal = totalBilled2 + totalBilled3;

  // Per-account tiles
  const accountTiles = [
    {
      label: "Account 2",
      billed: totalBilled2,
      kw: account2.reduce((s, r) => s + r.kw, 0),
      demand: account2.reduce((s, r) => s + r.demand, 0),
      latest: account2[account2.length - 1].billedAmount,
      prev: account2[account2.length - 2].billedAmount,
    },
    {
      label: "Account 3",
      billed: totalBilled3,
      kw: account3.reduce((s, r) => s + r.kw, 0),
      demand: account3.reduce((s, r) => s + r.demand, 0),
      latest: account3[account3.length - 1].billedAmount,
      prev: account3[account3.length - 2].billedAmount,
    },
  ];

  return (
    <div className="space-y-4">

      {/* Account Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {accountTiles.map((a) => {
          const diff = a.latest - a.prev;
          const pct = ((diff / a.prev) * 100).toFixed(1);
          const isPositive = diff >= 0;

          return (
            <Card key={a.label} className="overflow-hidden">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground mb-2">{a.label}</p>
                <p className="text-2xl font-bold tracking-tight">{fmtPHP(a.billed)}</p>
                <p className="text-xs text-muted-foreground">total billed (Jan – Apr)</p>

                <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Total kW</p>
                    <p className="text-xs font-medium">{fmt(a.kw)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Demand</p>
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
                    {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {isPositive ? "+" : ""}{pct}% vs prev month
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Line Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Monthly Billing Trend</CardTitle>
          <CardDescription>Account 2 vs Account 3 — billed amount (₱) per month</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-2 sm:px-6">
          <ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-full">
            <LineChart data={chartData}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(v) => `₱${(v / 1000000).toFixed(1)}M`}
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
                dataKey="account2"
                type="linear"
                stroke="var(--color-account2)"
                strokeWidth={2}
                dot={{ r: 4, fill: "var(--color-account2)" }}
                activeDot={{ r: 6 }}
              />
              <Line
                dataKey="account3"
                type="linear"
                stroke="var(--color-account3)"
                strokeWidth={2}
                dot={{ r: 4, fill: "var(--color-account3)" }}
                activeDot={{ r: 6 }}
              />
              <ChartLegend content={<ChartLegendContent />} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Summary Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Monthly Billing Summary</CardTitle>
          <CardDescription>Combined breakdown per month across all accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">Month</TableHead>
                <TableHead className="text-right font-semibold">Acct 2 kW</TableHead>
                <TableHead className="text-right font-semibold">Acct 2 Billed</TableHead>
                <TableHead className="text-right font-semibold">Acct 3 kW</TableHead>
                <TableHead className="text-right font-semibold">Acct 3 Billed</TableHead>
                <TableHead className="text-right font-semibold">Total Billed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {account2.map((a2, i) => {
                const a3 = account3[i];
                const total = a2.billedAmount + a3.billedAmount;
                return (
                  <TableRow key={a2.month}>
                    <TableCell className="font-medium">{a2.month}</TableCell>
                    <TableCell className="text-right tabular-nums">{a2.kw}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtPHP(a2.billedAmount)}</TableCell>
                    <TableCell className="text-right tabular-nums">{a3.kw}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtPHP(a3.billedAmount)}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">{fmtPHP(total)}</TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="border-t-2 font-semibold bg-muted/40">
                <TableCell>Total</TableCell>
                <TableCell className="text-right tabular-nums">
                  {account2.reduce((s, r) => s + r.kw, 0)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{fmtPHP(totalBilled2)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {account3.reduce((s, r) => s + r.kw, 0)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{fmtPHP(totalBilled3)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmtPHP(grandTotal)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}