"use client";

import { Fragment, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  CalendarIcon,
  TrendingUp,
  TrendingDown,
  LineChart as LineChartIcon,
  BarChart3,
  CheckCircle2,
  Circle,
  ChevronDown,
  CheckSquare,
  Square,
  Minus,
} from "lucide-react";

import { useProductsStore } from "@/store/products.store";
import { useProductionStore } from "@/store/production.store";
import { useProductionRange, aggregateViewItems } from "@/hooks/use-production-range";
import { useMultiMonthEntries } from "@/hooks/use-multi-month-entries";
import { useAnalyticsChart, type ChartSeriesConfig } from "@/hooks/use-analytics-charts";
import { useProductGroups, getGroupForSlug, PRODUCT_GROUPS } from "@/hooks/use-product-group";

function fmt(n: number | string | null | undefined): string {
  if (n === null || n === undefined) return "—";
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(num)) return "—";
  return Math.round(num).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function toMonthStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(monthStr: string): string {
  return format(new Date(`${monthStr}-01`), "MMM yyyy");
}

function generateMonthOptions(count = 24): { value: string; label: string }[] {
  const opts: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = toMonthStr(d);
    opts.push({ value, label: format(d, "MMMM yyyy") });
  }
  return opts;
}

// ── date picker button ──────────────────────────────────────────────────
function DatePickerButton({
  label,
  date,
  onSelect,
  disabled,
  maxDate,
  minDate,
}: {
  label: string;
  date: Date;
  onSelect: (d: Date | undefined) => void;
  disabled?: boolean;
  maxDate?: Date;
  minDate?: Date;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className="w-[170px] justify-start gap-2 text-left font-normal"
        >
          <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground">{label}:</span>
          {format(date, "MMM d, yyyy")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            onSelect(d);
            setOpen(false);
          }}
          disabled={(d) =>
            (maxDate ? d > maxDate : false) || (minDate ? d < minDate : false)
          }
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

// ── month multi-select dropdown (checkboxes) ─────────────────────────────
function MonthMultiSelect({
  selectedMonths,
  onChange,
}: {
  selectedMonths: string[];
  onChange: (months: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const options = useMemo(() => generateMonthOptions(24), []);

  function toggle(value: string) {
    onChange(
      selectedMonths.includes(value)
        ? selectedMonths.filter((m) => m !== value)
        : [...selectedMonths, value]
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[220px] justify-between font-normal">
          <span className="truncate text-sm">
            {selectedMonths.length === 0
              ? "Select months"
              : selectedMonths.length === 1
              ? monthLabel(selectedMonths[0])
              : `${selectedMonths.length} months selected`}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="end">
        <div className="max-h-64 overflow-y-auto p-1">
          {options.map((opt) => {
            const checked = selectedMonths.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => toggle(opt.value)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-muted text-left"
              >
                {checked ? (
                  <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                ) : (
                  <Square className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className="truncate">{opt.label}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between p-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => onChange([])}
          >
            Clear
          </Button>
          <span className="text-xs text-muted-foreground">
            {selectedMonths.length} selected
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── group filter chips ───────────────────────────────────────────────────
function GroupFilterChips({
  selectedKeys,
  onToggle,
  onSelectAll,
  onClear,
}: {
  selectedKeys: string[];
  onToggle: (key: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRODUCT_GROUPS.map((group) => {
        const isActive = selectedKeys.length === 0 || selectedKeys.includes(group.key);
        return (
          <button
            key={group.key}
            onClick={() => onToggle(group.key)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
              isActive
                ? "border-transparent text-white"
                : "border-muted-foreground/20 text-muted-foreground bg-muted/40"
            }`}
            style={isActive ? { backgroundColor: group.color.hex } : undefined}
          >
            {isActive ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <Circle className="h-3.5 w-3.5" />
            )}
            {group.label}
          </button>
        );
      })}
      <div className="flex items-center gap-1 ml-1">
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onSelectAll}>
          All
        </Button>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onClear}>
          None
        </Button>
      </div>
    </div>
  );
}

// ── product multi-select dropdown ───────────────────────────────────────
function ProductMultiSelect({
  products,
  selectedIds,
  onChange,
}: {
  products: { id: number; name: string }[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(id: number) {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((i) => i !== id)
        : [...selectedIds, id]
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[200px] justify-between font-normal">
          <span className="truncate text-sm">
            {selectedIds.length === 0
              ? "All products"
              : `${selectedIds.length} product${selectedIds.length > 1 ? "s" : ""} selected`}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="end">
        <div className="p-2 border-b">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full text-sm px-2 py-1.5 rounded-md border bg-transparent outline-none"
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No products found.
            </p>
          ) : (
            filtered.map((p) => {
              const checked = selectedIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggle(p.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-muted text-left"
                >
                  {checked ? (
                    <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                  ) : (
                    <Square className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="truncate">{p.name}</span>
                </button>
              );
            })
          )}
        </div>
        <div className="flex items-center justify-between p-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => onChange([])}
          >
            Clear
          </Button>
          <span className="text-xs text-muted-foreground">
            {selectedIds.length} selected
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── per-product tile ────────────────────────────────────────────────────
function ProductTile({
  label,
  unit,
  hex,
  actual,
  target,
  hasActualData,
}: {
  label: string;
  unit: string;
  hex: string;
  actual: number | null;
  target: number;
  hasActualData: boolean;
}) {
  const diff = (actual ?? 0) - target;
  const pct = target > 0 ? (diff / target) * 100 : null;
  const isPositive = diff >= 0;

  return (
    <Card className={`overflow-hidden ${!hasActualData ? "opacity-70" : ""}`}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: hex }} />
          <p className="text-xs text-muted-foreground truncate">{label}</p>
        </div>
        <p className="text-xl font-bold tracking-tight">
          {hasActualData ? fmt(actual) : "—"}
        </p>
        <p className="text-xs text-muted-foreground">
          {unit} · target {fmt(target)}
        </p>
        {hasActualData && target > 0 ? (
          <div
            className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded ${
              isPositive
                ? "bg-emerald-500/10 text-emerald-600"
                : "bg-rose-500/10 text-rose-600"
            }`}
          >
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isPositive ? "+" : ""}
            {Math.round(pct ?? 0)}%
          </div>
        ) : (
          <div className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Minus className="h-3 w-3" />
            No data
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── subtotal / grand total row ──────────────────────────────────────────
function TotalRow({
  label,
  totals,
  emphasize = false,
}: {
  label: string;
  totals: { actual: number; target: number; diff: number; pct: number | null; hasAnyData: boolean };
  emphasize?: boolean;
}) {
  const isPositive = totals.diff >= 0;
  return (
    <TableRow className={emphasize ? "bg-muted/70 font-semibold" : "bg-muted/20 font-medium"}>
      <TableCell>{label}</TableCell>
      <TableCell className="text-right tabular-nums">
        {totals.hasAnyData ? fmt(totals.actual) : "—"}
      </TableCell>
      <TableCell className="text-right tabular-nums text-muted-foreground">
        {fmt(totals.target)}
      </TableCell>
      <TableCell className="text-right text-muted-foreground text-xs">—</TableCell>
      <TableCell className="text-right">
        {totals.hasAnyData && totals.target > 0 ? (
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold ${
              isPositive ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isPositive ? "+" : "-"}
            {fmt(Math.abs(totals.diff))} ({isPositive ? "+" : "-"}
            {Math.round(Math.abs(totals.pct ?? 0))}%)
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            <Minus className="h-3 w-3 inline mr-1" />
            No data
          </span>
        )}
      </TableCell>
    </TableRow>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-4 pb-4 space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

// ── main component ──────────────────────────────────────────────────────
export default function ProductionAnalytics() {
  const { products, loading: productsLoading } = useProductsStore();

  const {
    from,
    to,
    setFrom,
    setTo,
    viewItems: rangeViewItems,
    loading: rangeLoading,
  } = useProductionRange(products);

  const { entries: rangeEntries, loading: rangeEntriesLoading } = useProductionStore();

  const [viewMode, setViewMode] = useState<"range" | "month">("range");
  const [selectedMonths, setSelectedMonths] = useState<string[]>([toMonthStr(new Date())]);

  const { entries: monthEntries, loading: monthLoading } = useMultiMonthEntries(
    viewMode === "month" ? selectedMonths : []
  );

  const monthViewItems = useMemo(
    () => aggregateViewItems(products, monthEntries),
    [products, monthEntries]
  );

  const [selectedGroupKeys, setSelectedGroupKeys] = useState<string[]>([]); // [] = all groups
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]); // [] = all products
  const [chartType, setChartType] = useState<"line" | "bar">("line");

  const activeEntries = viewMode === "month" ? monthEntries : rangeEntries;
  const activeViewItems = viewMode === "month" ? monthViewItems : rangeViewItems;
  const loading =
    productsLoading || (viewMode === "month" ? monthLoading : rangeLoading || rangeEntriesLoading);

  const filteredViewItems = useMemo(() => {
    return activeViewItems.filter((item) => {
      const group = getGroupForSlug(item.slug);
      const groupOk = selectedGroupKeys.length === 0 || (group && selectedGroupKeys.includes(group.key));
      const productOk = selectedProductIds.length === 0 || selectedProductIds.includes(item.id);
      return groupOk && productOk;
    });
  }, [activeViewItems, selectedGroupKeys, selectedProductIds]);

  const { groups: tableGroups, grandTotal } = useProductGroups(filteredViewItems);

  const { chartData, series, byProductMode } = useAnalyticsChart(
    activeEntries,
    products,
    selectedGroupKeys,
    selectedProductIds,
    viewMode === "month" ? "month" : "day"
  );

  function toggleGroup(key: string) {
    const allKeys = PRODUCT_GROUPS.map((g) => g.key);
    setSelectedGroupKeys((prev) => {
      const current = prev.length === 0 ? allKeys : prev;
      const isActive = current.includes(key);
      const next = isActive ? current.filter((k) => k !== key) : [...current, key];
      return next.length === allKeys.length ? [] : next;
    });
  }

  const hasAnyChartData = chartData.length > 0 && series.length > 0;
  const hasAnyTileData = filteredViewItems.length > 0;

  const periodLabel =
    viewMode === "month"
      ? selectedMonths.length === 0
        ? "No months selected"
        : selectedMonths.length === 1
        ? monthLabel(selectedMonths[0])
        : `${selectedMonths.length} months (${selectedMonths
            .slice()
            .sort()
            .map(monthLabel)
            .join(", ")})`
      : `${format(from, "PPP")} to ${format(to, "PPP")}`;

  return (
    <div className="space-y-4">
      {/* Filter card */}
      <Card>
        <CardHeader className="pb-3 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-sm font-medium">Analytics</CardTitle>
              <CardDescription>
                Compare output across product groups or specific products over time
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
                <button
                  onClick={() => setViewMode("range")}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    viewMode === "range"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Range
                </button>
                <button
                  onClick={() => setViewMode("month")}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    viewMode === "month"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Month
                </button>
              </div>

              {viewMode === "range" ? (
                <div className="flex items-center gap-2">
                  <DatePickerButton
                    label="From"
                    date={from}
                    onSelect={setFrom}
                    disabled={loading}
                    maxDate={new Date()}
                  />
                  <span className="text-muted-foreground text-sm">–</span>
                  <DatePickerButton
                    label="To"
                    date={to}
                    onSelect={setTo}
                    disabled={loading}
                    maxDate={new Date()}
                    minDate={from}
                  />
                </div>
              ) : (
                <MonthMultiSelect
                  selectedMonths={selectedMonths}
                  onChange={setSelectedMonths}
                />
              )}

              <ProductMultiSelect
                products={products}
                selectedIds={selectedProductIds}
                onChange={setSelectedProductIds}
              />
            </div>
          </div>

          {/* Group filter row */}
          <GroupFilterChips
            selectedKeys={selectedGroupKeys}
            onToggle={toggleGroup}
            onSelectAll={() => setSelectedGroupKeys([])}
            onClear={() => setSelectedGroupKeys(["__none__"])}
          />
        </CardHeader>
      </Card>

      {loading ? (
        <AnalyticsSkeleton />
      ) : (
        <>
          {/* Per-product tiles */}
          {!hasAnyTileData ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No products match the current filters.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {filteredViewItems.map((item) => (
                <ProductTile
                  key={item.id}
                  label={item.label}
                  unit={item.unit}
                  hex={getGroupForSlug(item.slug)?.color.hex ?? "#9ca3af"}
                  actual={item.actual}
                  target={item.target}
                  hasActualData={item.hasActualData}
                />
              ))}
            </div>
          )}

          {/* Chart */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="text-sm font-medium">
                    {byProductMode ? "Output by Product" : "Output by Group"}
                    {viewMode === "month" ? " (by Month)" : ""}
                  </CardTitle>
                  <CardDescription>
                    {series.length === 0
                      ? "No series selected"
                      : `${series.length} ${byProductMode ? "product" : "group"}${
                          series.length > 1 ? "s" : ""
                        } shown`}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
                  <button
                    onClick={() => setChartType("line")}
                    className={`p-1.5 rounded-md transition-all ${
                      chartType === "line"
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <LineChartIcon className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setChartType("bar")}
                    className={`p-1.5 rounded-md transition-all ${
                      chartType === "bar"
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!hasAnyChartData ? (
                <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                  {series.length === 0
                    ? "Select at least one group or product to see the chart."
                    : viewMode === "month" && selectedMonths.length === 0
                    ? "Select at least one month to see the chart."
                    : "No data for the selected period."}
                </div>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === "line" ? (
                      <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(d) =>
                            viewMode === "month"
                              ? monthLabel(d as string)
                              : format(new Date(d as string), "MMM d")
                          }
                          fontSize={11}
                        />
                        <YAxis fontSize={11} />
                        <Tooltip
                          labelFormatter={(d) =>
                            viewMode === "month"
                              ? monthLabel(d as string)
                              : format(new Date(d as string), "PPP")
                          }
                          formatter={(value) => fmt(value as number)}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        {series.map((s: ChartSeriesConfig) => (
                          <Line
                            key={s.key}
                            type="monotone"
                            dataKey={s.label}
                            stroke={s.color}
                            strokeWidth={2}
                            dot={false}
                            connectNulls
                          />
                        ))}
                      </LineChart>
                    ) : (
                      <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(d) =>
                            viewMode === "month"
                              ? monthLabel(d as string)
                              : format(new Date(d as string), "MMM d")
                          }
                          fontSize={11}
                        />
                        <YAxis fontSize={11} />
                        <Tooltip
                          labelFormatter={(d) =>
                            viewMode === "month"
                              ? monthLabel(d as string)
                              : format(new Date(d as string), "PPP")
                          }
                          formatter={(value) => fmt(value as number)}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        {series.map((s: ChartSeriesConfig) => (
                          <Bar key={s.key} dataKey={s.label} fill={s.color} />
                        ))}
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detailed table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Detailed Breakdown</CardTitle>
              <CardDescription>{periodLabel}</CardDescription>
            </CardHeader>
            <CardContent>
              {!hasAnyTileData ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No products match the current filters.
                </p>
              ) : (
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
                    {tableGroups.map((group) => (
                      <Fragment key={group.key}>
                        <TableRow className="hover:bg-transparent bg-muted/40">
                          <TableCell
                            colSpan={5}
                            className={`text-xs font-semibold border-l-4 ${group.color.border}`}
                          >
                            <span
                              className={`inline-block h-2 w-2 rounded-full mr-2 ${group.color.dot}`}
                            />
                            {group.label}
                          </TableCell>
                        </TableRow>

                        {group.items.map((item) => {
                          if (!item.hasActualData) {
                            return (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.label}</TableCell>
                                <TableCell className="text-right text-muted-foreground">—</TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                  {fmt(item.target)}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground text-xs">
                                  {item.unit}
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                    <Minus className="h-3 w-3" />
                                    No entry
                                  </span>
                                </TableCell>
                              </TableRow>
                            );
                          }

                          const diff = item.actual! - item.target;
                          const pct = item.target > 0 ? (diff / item.target) * 100 : null;
                          const isPositive = diff >= 0;

                          return (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.label}</TableCell>
                              <TableCell className="text-right tabular-nums">
                                {fmt(item.actual!)}
                              </TableCell>
                              <TableCell className="text-right tabular-nums text-muted-foreground">
                                {fmt(item.target)}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground text-xs">
                                {item.unit}
                              </TableCell>
                              <TableCell className="text-right">
                                {item.target > 0 ? (
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
                                    {isPositive ? "+" : "-"}
                                    {fmt(Math.abs(diff))} ({isPositive ? "+" : "-"}
                                    {Math.round(Math.abs(pct ?? 0))}%)
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">No target</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}

                        <TotalRow label={group.subtotalLabel} totals={group.totals} />
                      </Fragment>
                    ))}

                    <TotalRow label="Grand Total" totals={grandTotal} emphasize />
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}