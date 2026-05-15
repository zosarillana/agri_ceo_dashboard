"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { mockData } from "@/routes/auth/-data/-mock-data";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { TrendingUp, TrendingDown, FlaskConical, CheckCircle } from "lucide-react";

function fmt(n: number) {
  return n.toLocaleString();
}

const chartConfig = {
  passed: {
    label: "Passed",
    color: "var(--chart-1)",
  },
  failed: {
    label: "Failed",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export default function TradingDash() {
  const qc = mockData.qc;
  const [timeRange, setTimeRange] = React.useState("90d");

  const areaData = qc.products.map((p) => ({
    date: p.name,
    passed: p.passed,
    failed: p.tested - p.passed,
  }));

  const filteredData = React.useMemo(() => {
    if (timeRange === "7d") return areaData.slice(-7);
    if (timeRange === "30d") return areaData.slice(-30);
    return areaData;
  }, [timeRange, areaData]);

  const stats = [
    {
      label: "Pass Rate",
      value: `${qc.passRate}%`,
      icon: TrendingUp,
      trend: "positive",
      sub: "of all samples",
    },
    {
      label: "Reject Rate",
      value: `${qc.rejectionRate}%`,
      icon: TrendingDown,
      trend: "negative",
      sub: "of all samples",
    },
    {
      label: "Samples Tested",
      value: fmt(qc.samplesTested),
      icon: FlaskConical,
      trend: "neutral",
      sub: "total this period",
    },
    {
      label: "Samples Passed",
      value: fmt(qc.samplesPassed),
      icon: CheckCircle,
      trend: "positive",
      sub: "cleared QC",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                    <p className="text-2xl font-bold tracking-tight">{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
                  </div>
                  <div
                    className={`p-2 rounded-md ${
                      s.trend === "positive"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : s.trend === "negative"
                        ? "bg-rose-500/10 text-rose-500"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Area Chart */}
      <Card className="pt-0">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle>Product QC Results</CardTitle>
            <CardDescription>Passed vs failed samples across product lines</CardDescription>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
              aria-label="Select a value"
            >
              <SelectValue placeholder="All products" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">All products</SelectItem>
              <SelectItem value="30d" className="rounded-lg">Last 30</SelectItem>
              <SelectItem value="7d" className="rounded-lg">Last 7</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillPassed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-passed)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-passed)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillFailed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-failed)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-failed)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Area
                dataKey="failed"
                type="natural"
                fill="url(#fillFailed)"
                stroke="var(--color-failed)"
                stackId="a"
              />
              <Area
                dataKey="passed"
                type="natural"
                fill="url(#fillPassed)"
                stroke="var(--color-passed)"
                stackId="a"
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* QC Products Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">QC by Product</CardTitle>
          <CardDescription>Pass and rejection rates per product line</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">Product</TableHead>
                <TableHead className="text-right font-semibold">Tested</TableHead>
                <TableHead className="text-right font-semibold">Passed</TableHead>
                <TableHead className="text-right font-semibold">Pass %</TableHead>
                <TableHead className="text-right font-semibold">Rejection %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {qc.products.map((p) => {
                const passRate = ((p.passed / p.tested) * 100).toFixed(1);
                const rejectRate = (((p.tested - p.passed) / p.tested) * 100).toFixed(1);
                const passNum = parseFloat(passRate);

                return (
                  <TableRow key={p.name}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.tested}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.passed}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          passNum >= 97
                            ? "default"
                            : passNum >= 90
                            ? "secondary"
                            : "destructive"
                        }
                        className="text-xs tabular-nums"
                      >
                        {passRate}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`text-xs font-medium tabular-nums ${
                          parseFloat(rejectRate) <= 3
                            ? "text-emerald-500"
                            : parseFloat(rejectRate) <= 10
                            ? "text-amber-500"
                            : "text-rose-500"
                        }`}
                      >
                        {rejectRate}%
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