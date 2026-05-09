"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown } from "lucide-react";
import { mockData } from "@/routes/auth/admin/_layout/dashboard/data/-mock-data";

function fmt(n: number) {
  return n.toLocaleString();
}

export default function ProductionDash() {
  const d = mockData.production;

  const items = [
    { label: "Coconut Water", ...d.coconutWater },
    { label: "CWC", ...d.cwc },
    { label: "Coconut Oil", ...d.coconutOil },
    { label: "Cream UHT", ...d.creamUHT },
    { label: "Cream Frozen", ...d.creamFrozen },
    { label: "Cake Flour", ...d.cakeFlour },
  ];

  return (
    <div className="space-y-4">
      {/* Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {items.map((item) => {
          const diff = item.actual - item.target;
          const pct = ((diff / item.target) * 100).toFixed(1);
          const isPositive = diff >= 0;

          return (
            <Card key={item.label} className="overflow-hidden">
              <CardContent className="pt-4 pb-4">
                {/* Label */}
                <p className="text-xs text-muted-foreground mb-2">{item.label}</p>

                {/* Actual */}
                <p className="text-2xl font-bold tracking-tight">{fmt(item.actual)}</p>
                <p className="text-xs text-muted-foreground">{item.unit}/day</p>

                <div className="mt-3 pt-3 border-t flex items-center justify-between">
                  {/* Target */}
                  <div>
                    <p className="text-xs text-muted-foreground">Target</p>
                    <p className="text-xs font-medium">{fmt(item.target)}</p>
                  </div>

                  {/* Delta */}
                  <div
                    className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md ${
                      isPositive
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-rose-500/10 text-rose-600"
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {isPositive ? "+" : ""}{fmt(diff)} ({isPositive ? "+" : ""}{pct}%)
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Daily Output Summary</CardTitle>
          <CardDescription>Actual vs target across all product lines</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">Product</TableHead>
                <TableHead className="text-right font-semibold">Actual</TableHead>
                <TableHead className="text-right font-semibold">Target</TableHead>
                <TableHead className="text-right font-semibold">Unit</TableHead>
                <TableHead className="text-right font-semibold">vs Target</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const diff = item.actual - item.target;
                const pct = ((diff / item.target) * 100).toFixed(1);
                const isPositive = diff >= 0;

                return (
                  <TableRow key={item.label}>
                    <TableCell className="font-medium">{item.label}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(item.actual)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{fmt(item.target)}</TableCell>
                    <TableCell className="text-right text-muted-foreground text-xs">{item.unit}/day</TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold ${
                          isPositive ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {isPositive ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {isPositive ? "+" : ""}{pct}%
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}