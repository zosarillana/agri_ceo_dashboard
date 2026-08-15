"use client";

import { Fragment, useState, useCallback } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  CalendarIcon,
  Minus,
  BarChart2,
  Package,
  PlusCircle,
  Import,
  BarChart4,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";

import { useProductsStore } from "@/store/products.store";
import { useProductionStore } from "@/store/production.store";

import ProductInputForm from "../-forms/product-form";
import DailyProductionForm from "../-forms/production-form";

import { useRole } from "@/hooks/use-role";
import { getAllowedTabs, type Tab } from "@/lib/permissions";
import ProductionImportForm from "../-imports/production-import";
import ProductionImportViewer from "../-imports/production-import-viewer";
import { useProductGroups } from "@/hooks/use-product-group";
import { useProductionRange } from "@/hooks/use-production-range";
import ProductionAnalytics from "../-analytics/production-analytics";

function fmt(n: number | string | null | undefined): string {
  if (n === null || n === undefined) return "—";
  let num = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(num)) return "—";
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getTodayISO() {
  return new Date().toLocaleDateString("en-CA");
}

// ── skeletons ─────────────────────────────────────────────────────────────────

function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56 mt-1" />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {["Product", "Actual", "Target", "Unit", "vs Target"].map((h) => (
                <TableHead key={h} className="font-semibold">
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 5 }).map((__, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full max-w-[80px]" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function InputTabSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-4 pb-4 space-y-3">
            <div className="flex items-baseline justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-12" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-9 w-full rounded-md" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ProductTabSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-4 pb-4">
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((__, j) => (
                <Skeleton key={j} className="h-9 w-full rounded-md" />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// small reusable date-picker button used for both "From" and "To"
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

// A subtotal / grand-total row for the table
function TotalRow({
  label,
  totals,
  unit = "",
  emphasize = false,
}: {
  label: string;
  totals: { actual: number; target: number; diff: number; pct: number | null; hasAnyData: boolean };
  unit?: string;
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
      <TableCell className="text-right text-muted-foreground text-xs">{unit}</TableCell>
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
            {Math.abs(totals.pct ?? 0).toFixed(1)}%)
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

// ── component ─────────────────────────────────────────────────────────────────

export default function ProductionDash() {
  const role = useRole();
  const allowedTabs = getAllowedTabs(role);

  const [tab, setTab] = useState<Tab>("view");

  const { products, loading: productsLoading, fetchProducts } = useProductsStore();
  useProductionStore();

  const {
    mode,
    setMode,
    from,
    to,
    setFrom,
    setTo,
    month,
    goToPreviousMonth,
    goToNextMonth,
    isCurrentMonth,
    isSingleDay,
    viewItems,
    loading: entriesLoading,
  } = useProductionRange(products);

  const loading = productsLoading || entriesLoading;

  // fetch products once on mount
  useState(() => {
    fetchProducts();
  });

  const hasAnyActualData = viewItems.some((item) => item.hasActualData);
  const hasAllActualData =
    viewItems.length > 0 && viewItems.every((item) => item.hasActualData);

  const { groups: groupedViewItems, grandTotal } = useProductGroups(viewItems);

  const handleProductSave = useCallback(() => {
    fetchProducts();
  }, [fetchProducts]);

  const todayISO = getTodayISO();

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted w-fit">
        {(["view","analytics" ,"input", "products", "import"] as Tab[])
          .filter((t) => allowedTabs.includes(t))
          .map((t) => (
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
              {t === "analytics" && <BarChart4 className="h-3.5 w-3.5" />}
              {t === "input" && <PlusCircle className="h-3.5 w-3.5" />}
              {t === "products" && <Package className="h-3.5 w-3.5" />}
              {t === "import" && <Import className="h-3.5 w-3.5" />}
              {t}
            </button>
          ))}
      </div>

      {/* ── VIEW TAB ─────────────────────────────────── */}
      {tab === "view" && (
        <>
          {/* Filter card — Range / Month toggle */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="text-sm font-medium">
                    Production Overview
                  </CardTitle>
                  <CardDescription>
                    View actual vs target across all product lines
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* mode toggle */}
                  <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
                    <button
                      onClick={() => setMode("range")}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        mode === "range"
                          ? "bg-background shadow-sm text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Range
                    </button>
                    <button
                      onClick={() => setMode("month")}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        mode === "month"
                          ? "bg-background shadow-sm text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Month
                    </button>
                  </div>

                  {mode === "range" ? (
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
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={goToPreviousMonth}
                        disabled={loading}
                      >
                        ‹
                      </Button>
                      <div className="w-[140px] text-center text-sm font-medium border rounded-md py-2">
                        {format(month, "MMMM yyyy")}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={goToNextMonth}
                        disabled={loading || isCurrentMonth}
                      >
                        ›
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {loading ? (
            <TableSkeleton />
          ) : viewItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No products found. Add products in the{" "}
                <button
                  className="underline hover:text-foreground"
                  onClick={() => setTab("products")}
                >
                  Products tab
                </button>
                .
              </CardContent>
            </Card>
          ) : !hasAnyActualData ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center space-y-4">
                <div className="flex justify-center">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground/50" />
                </div>
                <div>
                  <h3 className="font-medium text-base">
                    No production entries yet
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {mode === "month"
                      ? `No data recorded for ${format(month, "MMMM yyyy")}.`
                      : isSingleDay
                      ? `No data recorded for ${format(from, "PPP")}.`
                      : `No data recorded between ${format(from, "PPP")} and ${format(to, "PPP")}.`}
                  </p>
                </div>
                <Button
                  onClick={() => setTab("input")}
                  variant="outline"
                  className="mt-2"
                >
                  Add production entries
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {mode === "month"
                    ? "Monthly Output Summary"
                    : isSingleDay
                    ? "Daily Output Summary"
                    : "Output Summary"}
                </CardTitle>
                <CardDescription>
                  Actual vs target across all product lines{" "}
                  {mode === "month"
                    ? `for ${format(month, "MMMM yyyy")}`
                    : isSingleDay
                    ? `for ${format(from, "PPP")}`
                    : `from ${format(from, "PPP")} to ${format(to, "PPP")}`}
                  {!hasAllActualData && " (incomplete data)"}
                </CardDescription>
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
                    {groupedViewItems.map((group) => (
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
                          const pct = item.target > 0 ? ((diff / item.target) * 100).toFixed(1) : "—";
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
                                    {Math.abs(parseFloat(pct))}%)
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">No target</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}

                        {/* group subtotal */}
                        <TotalRow label={`${group.label} — Subtotal`} totals={group.totals} />
                      </Fragment>
                    ))}

                    {/* grand total across every group */}
                    <TotalRow label="Grand Total" totals={grandTotal} emphasize />
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ── INPUT TAB ────────────────────────────────── */}
      {tab === "input" && (
        <>
          {loading ? (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Daily Production Entry
                  </CardTitle>
                  <CardDescription>
                    Enter actual output and targets for each product line
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-9 w-[200px]" />
                </CardContent>
              </Card>
              <InputTabSkeleton count={products.length || 6} />
            </>
          ) : (
            <DailyProductionForm
              products={products}
              entries={[]}
              onSave={() => {}}
              initialDate={todayISO}
            />
          )}
        </>
      )}

      {/* ── PRODUCTS TAB ─────────────────────────────── */}
      {tab === "products" && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Product Definitions
              </CardTitle>
              <CardDescription>
                Add product lines used across production tracking
              </CardDescription>
            </CardHeader>
          </Card>

          {productsLoading ? <ProductTabSkeleton /> : null}

          <ProductInputForm onSave={handleProductSave} />
        </>
      )}

      {/* ── IMPORT TAB ─────────────────────────────── */}
      {tab === "import" && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Import Products
              </CardTitle>
              <CardDescription>
                Import product data into the system
              </CardDescription>
            </CardHeader>
          </Card>
          <ProductionImportForm onImported={() => {}} />
          <ProductionImportViewer />
        </>
      )}

      
      {/* ── IMPORT TAB ─────────────────────────────── */}
      {tab === "analytics" && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Analytics
              </CardTitle>
              <CardDescription>
                View production analytics and reports
              </CardDescription>
            </CardHeader>
          </Card>
          <ProductionAnalytics />
        </>
      )}
    </div>
  );
}