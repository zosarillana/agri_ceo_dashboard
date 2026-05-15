"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import { TrendingUp, TrendingDown } from "lucide-react";

import { useProductionStore } from "@/store/production.store";
import { useProductsStore } from "@/store/products.store";

import ProductInputForm from "../-forms/product-form";
import DailyProductionForm from "../-forms/production-form";

type Tab = "view" | "input" | "products";

function fmt(n: number) {
  return n.toLocaleString();
}

function getTodayISO() {
  return new Date().toISOString().split("T")[0];
}

// ── skeletons ─────────────────────────────────────────────────────────────────

function CardSkeletons({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="pt-4 pb-4 space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-3 w-12" />
            <div className="mt-3 pt-3 border-t flex items-center justify-between">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-6 w-20 rounded-md" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

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

// ── component ─────────────────────────────────────────────────────────────────

export default function ProductionDash() {
  const [tab, setTab] = useState<Tab>("view");

  const {
    products,
    loading: productsLoading,
    fetchProducts,
  } = useProductsStore();

  const {
    entries,
    loading: entriesLoading,
    fetchByDate,
  } = useProductionStore();

  const loading = productsLoading || entriesLoading;

  const initialized = useRef(false);
  const productsFetched = useRef(false);

  // LOAD PRODUCTS (once)
  useEffect(() => {
    if (!productsFetched.current) {
      productsFetched.current = true;
      fetchProducts();
    }
  }, [fetchProducts]);

  // LOAD TODAY ENTRIES (once products are ready)
  useEffect(() => {
    if (products.length === 0 && !productsLoading) return;
    if (!initialized.current && products.length > 0) {
      initialized.current = true;
      fetchByDate(getTodayISO());
    }
  }, [products, productsLoading, fetchByDate]);

  // VIEW DATA — merge products + entries
  const viewItems = products.map((pr) => {
    const entry = entries.find((e) => e.product_id === pr.id);
    return {
      id: pr.id,
      label: pr.name,
      actual: entry?.actual_output ?? 0,
      target: entry?.target_output ?? pr.default_target ?? 0,
      unit: pr.unit ?? "—",
    };
  });

  // Refresh entries after input-tab save
  const handleProductionSave = useCallback(() => {
    fetchByDate(getTodayISO());
  }, [fetchByDate]);

  // Refresh products after product-tab save
  const handleProductSave = useCallback(() => {
    if (!productsFetched.current || products.length === 0) {
      fetchProducts();
    }
  }, [fetchProducts, products.length]);

  return (
    <div className="space-y-4">

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b">
        {(["view", "input", "products"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── VIEW TAB ─────────────────────────────────── */}
      {tab === "view" && (
        <>
          {loading ? (
            <>
              <CardSkeletons />
              <TableSkeleton />
            </>
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
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {viewItems.map((item) => {
                  const diff = item.actual - item.target;
                  const pct =
                    item.target > 0
                      ? ((diff / item.target) * 100).toFixed(1)
                      : "—";
                  const isPositive = diff >= 0;

                  return (
                    <Card key={item.id} className="overflow-hidden">
                      <CardContent className="pt-4 pb-4">
                        <p className="text-xs text-muted-foreground mb-2">{item.label}</p>
                        <p className="text-2xl font-bold tracking-tight">
                          {fmt(item.actual)}
                        </p>
                        <p className="text-xs text-muted-foreground">{item.unit}/day</p>
                        <div className="mt-3 pt-3 border-t flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">Target</p>
                            <p className="text-xs font-medium">{fmt(item.target)}</p>
                          </div>
                          {item.target > 0 && (
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
                              {isPositive ? "+" : ""}
                              {fmt(diff)} ({isPositive ? "+" : ""}
                              {pct}%)
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Daily Output Summary
                  </CardTitle>
                  <CardDescription>
                    Actual vs target across all product lines
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
                      {viewItems.map((item) => {
                        const diff = item.actual - item.target;
                        const pct =
                          item.target > 0
                            ? ((diff / item.target) * 100).toFixed(1)
                            : "—";
                        const isPositive = diff >= 0;

                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.label}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {fmt(item.actual)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground">
                              {fmt(item.target)}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground text-xs">
                              {item.unit}/day
                            </TableCell>
                            <TableCell className="text-right">
                              {item.target > 0 ? (
                                <span
                                  className={`inline-flex items-center gap-1 text-xs font-semibold ${
                                    isPositive
                                      ? "text-emerald-600"
                                      : "text-rose-600"
                                  }`}
                                >
                                  {isPositive ? (
                                    <TrendingUp className="h-3 w-3" />
                                  ) : (
                                    <TrendingDown className="h-3 w-3" />
                                  )}
                                  {isPositive ? "+" : ""}
                                  {pct}%
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  No target
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {/* ── INPUT TAB ────────────────────────────────── */}
      {tab === "input" && (
        <>
          {/* Show skeleton only while initial load is in flight */}
          {loading ? (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Daily Production Entry</CardTitle>
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
            // Pass already-loaded data — no extra fetch
            <DailyProductionForm
              products={products}
              entries={entries}
              onSave={handleProductionSave}
            />
          )}
        </>
      )}

      {/* ── PRODUCTS TAB ─────────────────────────────── */}
      {tab === "products" && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Product Definitions</CardTitle>
              <CardDescription>
                Add product lines used across production tracking
              </CardDescription>
            </CardHeader>
          </Card>

          {productsLoading ? (
            <ProductTabSkeleton />
          ) : products.length > 0 ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Existing Products</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold">Name</TableHead>
                      <TableHead className="font-semibold">Unit</TableHead>
                      <TableHead className="text-right font-semibold">
                        Default Target / day
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((pr) => (
                      <TableRow key={pr.id}>
                        <TableCell className="font-medium">{pr.name}</TableCell>
                        <TableCell className="text-muted-foreground">{pr.unit}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {fmt(pr.default_target ?? 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : null}

          <ProductInputForm onSave={handleProductSave} />
        </>
      )}
    </div>
  );
}