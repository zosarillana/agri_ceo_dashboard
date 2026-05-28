// src/routes/auth/.../qc-dash.tsx

"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { format } from "date-fns";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  TrendingUp,
  TrendingDown,
  FlaskConical,
  CheckCircle,
  BarChart2,
  PlusCircle,
  CalendarIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQcStore } from "@/store/qc.store";
import { useProductsStore } from "@/store/products.store";
import QCInputForm from "../../-components/-forms/qc-input-form";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString();
}

function getTodayISO() {
  return new Date().toLocaleDateString("en-CA");
}

function isoToDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function dateToISO(d: Date) {
  return d.toLocaleDateString("en-CA");
}

// ─── Chart config ─────────────────────────────────────────────────────────────

const chartConfig = {
  passed: { label: "Passed", color: "var(--chart-1)" },
  failed: { label: "Failed", color: "var(--chart-2)" },
} satisfies ChartConfig;

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ViewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-5 pb-4 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="pt-6 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function QcDash() {
  const [activeTab, setActiveTab] = React.useState<"view" | "input">("view");
  const [timeRange] = React.useState("90d");

  // ── Single date picker state ────────────────────────────────────────────────
  const [dateISO, setDateISO] = React.useState(getTodayISO);
  const [calOpen, setCalOpen] = React.useState(false);
  const selectedDate = isoToDate(dateISO);
  const isToday = dateISO === getTodayISO();

  // ── Products store ──────────────────────────────────────────────────────────
  const {
    products,
    loading: productsLoading,
    fetchProducts,
  } = useProductsStore();

  const productsFetched = React.useRef(false);
  React.useEffect(() => {
    if (!productsFetched.current) {
      productsFetched.current = true;
      fetchProducts();
    }
  }, [fetchProducts]);

  // ── QC store ────────────────────────────────────────────────────────────────
  const { records, summary, loading: qcLoading, fetchLatest } = useQcStore();

  const qcFetched = React.useRef(false);
  React.useEffect(() => {
    if (!qcFetched.current) {
      qcFetched.current = true;
      fetchLatest(dateISO, dateISO);
    }
  }, [fetchLatest, dateISO]);

  // ── Date change ─────────────────────────────────────────────────────────────
  function handleDateChange(date: Date | undefined) {
    if (!date) return;
    const iso = dateToISO(date);
    setDateISO(iso);
    setCalOpen(false);
    fetchLatest(iso, iso);
  }

  function handleToday() {
    const today = getTodayISO();
    setDateISO(today);
    fetchLatest(today, today);
  }

  const loading = productsLoading || qcLoading;

  // ── Chart data ──────────────────────────────────────────────────────────────
  const areaData = records.map((r) => ({
    date: r.product?.name ?? `#${r.product_id}`,
    passed: r.passed,
    failed: r.failed,
  }));

  const filteredData = React.useMemo(() => {
    if (timeRange === "7d") return areaData.slice(-7);
    if (timeRange === "30d") return areaData.slice(-30);
    return areaData;
  }, [timeRange, areaData]);

  // ── Stat cards ──────────────────────────────────────────────────────────────
  const stats = [
    {
      label: "Pass Rate",
      value: `${Number(summary.pass_rate).toFixed(1)}%`,
      icon: TrendingUp,
      trend: "positive",
      sub: "of all samples",
    },
    {
      label: "Reject Rate",
      value: `${Number(summary.rejection_rate).toFixed(1)}%`,
      icon: TrendingDown,
      trend: "negative",
      sub: "of all samples",
    },
    {
      label: "Samples Tested",
      value: fmt(summary.samples_tested),
      icon: FlaskConical,
      trend: "neutral",
      sub: "total this period",
    },
    {
      label: "Samples Passed",
      value: fmt(summary.samples_passed),
      icon: CheckCircle,
      trend: "positive",
      sub: "cleared QC",
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted w-fit">
        {(["view", "input"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${
              activeTab === t
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
      {activeTab === "view" && (
        <div className="space-y-6">
          {/* Single date picker */}
          <div className="flex items-end gap-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Date</p>
              <Popover open={calOpen} onOpenChange={setCalOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={qcLoading}
                    className={cn(
                      "w-[240px] justify-start text-left font-normal h-9",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateChange}
                    disabled={(d) => d > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {!isToday && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleToday}
                className="h-9"
              >
                Today
              </Button>
            )}
          </div>

          {loading ? (
            <ViewSkeleton />
          ) : (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {stats.map((s) => {
                  const Icon = s.icon;
                  return (
                    <Card key={s.label}>
                      <CardContent className="pt-5 pb-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              {s.label}
                            </p>
                            <p className="text-2xl font-bold tracking-tight">
                              {s.value}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {s.sub}
                            </p>
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

              {/* Empty state */}
              {records.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-sm text-muted-foreground">
                    No QC records for {format(selectedDate, "MMM d, yyyy")}. Use
                    the Input tab to add records.
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Area Chart */}
                  <Card className="pt-0">
                    <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                      <div className="grid flex-1 gap-1">
                        <CardTitle>Product QC Results</CardTitle>
                        <CardDescription>
                          Passed vs failed samples across product lines
                        </CardDescription>
                      </div>
                      {/* <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger
                          className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
                          aria-label="Select a value"
                        >
                          <SelectValue placeholder="All products" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="90d" className="rounded-lg">
                            All products
                          </SelectItem>
                          <SelectItem value="30d" className="rounded-lg">
                            Last 30
                          </SelectItem>
                          <SelectItem value="7d" className="rounded-lg">
                            Last 7
                          </SelectItem>
                        </SelectContent>
                      </Select> */}
                    </CardHeader>
                    <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                      <ChartContainer
                        config={chartConfig}
                        className="aspect-auto h-[250px] w-full"
                      >
                        <AreaChart data={filteredData}>
                          <defs>
                            <linearGradient
                              id="fillPassed"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="var(--color-passed)"
                                stopOpacity={0.8}
                              />
                              <stop
                                offset="95%"
                                stopColor="var(--color-passed)"
                                stopOpacity={0.1}
                              />
                            </linearGradient>
                            <linearGradient
                              id="fillFailed"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="var(--color-failed)"
                                stopOpacity={0.8}
                              />
                              <stop
                                offset="95%"
                                stopColor="var(--color-failed)"
                                stopOpacity={0.1}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid vertical={false} />
                          <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={12}
                            minTickGap={20}
                            angle={-30}
                            textAnchor="end"
                            height={70}
                            interval={0}
                            tick={{ fontSize: 11 }}
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
                      <CardTitle className="text-sm font-medium">
                        QC by Product
                      </CardTitle>
                      <CardDescription>
                        Pass and rejection rates per product line
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="font-semibold">
                              Product
                            </TableHead>
                            <TableHead className="text-right font-semibold">
                              Tested
                            </TableHead>
                            <TableHead className="text-right font-semibold">
                              Passed
                            </TableHead>
                            <TableHead className="text-right font-semibold">
                              Pass %
                            </TableHead>
                            <TableHead className="text-right font-semibold">
                              Rejection %
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {records.map((r) => {
                            const passRate = Number(r.pass_rate).toFixed(1);
                            const rejectRate = Number(r.rejection_rate).toFixed(
                              1,
                            );
                            const passNum = parseFloat(passRate);

                            return (
                              <TableRow key={r.id}>
                                <TableCell className="font-medium">
                                  {r.product?.name ??
                                    `Product #${r.product_id}`}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {r.tested}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {r.passed}
                                </TableCell>
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

                          {/* Totals row */}
                          <TableRow className="border-t-2 bg-muted/30 hover:bg-muted/30">
                            <TableCell className="font-semibold">
                              Total
                            </TableCell>
                            <TableCell className="text-right font-semibold tabular-nums">
                              {fmt(summary.samples_tested)}
                            </TableCell>
                            <TableCell className="text-right font-semibold tabular-nums">
                              {fmt(summary.samples_passed)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant={
                                  summary.pass_rate >= 97
                                    ? "default"
                                    : summary.pass_rate >= 90
                                      ? "secondary"
                                      : "destructive"
                                }
                                className="text-xs tabular-nums"
                              >
                                {Number(summary.pass_rate).toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <span
                                className={`text-xs font-medium tabular-nums ${
                                  summary.rejection_rate <= 3
                                    ? "text-emerald-500"
                                    : summary.rejection_rate <= 10
                                      ? "text-amber-500"
                                      : "text-rose-500"
                                }`}
                              >
                                {Number(summary.rejection_rate).toFixed(1)}%
                              </span>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ── INPUT TAB ── */}
      {activeTab === "input" && (
        <QCInputForm
          products={products.filter((p) => p.is_active)}
          loading={productsLoading}
          onSaved={() => {
            fetchLatest(dateISO, dateISO);
            setActiveTab("view");
          }}
        />
      )}
    </div>
  );
}
