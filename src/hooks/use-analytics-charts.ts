import { useMemo } from "react";
import { PRODUCT_GROUPS, getGroupForSlug } from "./use-product-group";
import type { ProductionEntry } from "@/types/production.types";
import type { Product } from "@/types/products.types";

const PRODUCT_PALETTE = [
  "#3b82f6", "#ec4899", "#eab308", "#22c55e", "#a855f7",
  "#f97316", "#14b8a6", "#ef4444", "#6366f1", "#84cc16",
  "#06b6d4", "#f43f5e",
];

export interface ChartSeriesConfig {
  key: string;
  label: string;
  color: string;
}

export interface ChartPoint {
  date: string;
  [seriesLabel: string]: number | string;
}

export interface UseAnalyticsChartResult {
  chartData: ChartPoint[];
  series: ChartSeriesConfig[];
  byProductMode: boolean;
}

export type ChartBucket = "day" | "month";

/**
 * Builds chart series + data points, bucketed either by day or by month.
 * - If selectedProductIds is non-empty: one line/bar per selected PRODUCT.
 * - Otherwise: one line/bar per GROUP (respecting selectedGroupKeys).
 */
export function useAnalyticsChart(
  entries: ProductionEntry[],
  products: Product[],
  selectedGroupKeys: string[],
  selectedProductIds: number[],
  bucketBy: ChartBucket = "day"
): UseAnalyticsChartResult {
  const byProductMode = selectedProductIds.length > 0;

  const series: ChartSeriesConfig[] = useMemo(() => {
    if (byProductMode) {
      return products
        .filter((p) => selectedProductIds.includes(p.id))
        .map((p, i) => ({
          key: String(p.id),
          label: p.name,
          color: PRODUCT_PALETTE[i % PRODUCT_PALETTE.length],
        }));
    }
    return PRODUCT_GROUPS.filter(
      (g) => selectedGroupKeys.length === 0 || selectedGroupKeys.includes(g.key)
    ).map((g) => ({ key: g.key, label: g.label, color: g.color.hex }));
  }, [byProductMode, products, selectedProductIds, selectedGroupKeys]);

  const chartData: ChartPoint[] = useMemo(() => {
    const byBucket = new Map<string, ChartPoint>();

    entries.forEach((e) => {
      let seriesLabel: string | null = null;

      if (byProductMode) {
        if (!selectedProductIds.includes(e.product_id)) return;
        const product = products.find((p) => p.id === e.product_id);
        seriesLabel = product?.name ?? null;
      } else {
        const product = products.find((p) => p.id === e.product_id);
        const group = getGroupForSlug((product as any)?.slug);
        if (!group) return;
        if (selectedGroupKeys.length > 0 && !selectedGroupKeys.includes(group.key)) return;
        seriesLabel = group.label;
      }

      if (!seriesLabel) return;

      const bucketKey =
        bucketBy === "month"
          ? e.production_date.slice(0, 7) // "YYYY-MM"
          : e.production_date.slice(0, 10); // "YYYY-MM-DD"

      if (!byBucket.has(bucketKey)) byBucket.set(bucketKey, { date: bucketKey });
      const point = byBucket.get(bucketKey)!;
      point[seriesLabel] = ((point[seriesLabel] as number) || 0) + Number(e.actual_output || 0);
    });

    return Array.from(byBucket.values()).sort((a, b) =>
      (a.date as string).localeCompare(b.date as string)
    );
  }, [entries, products, byProductMode, selectedProductIds, selectedGroupKeys, bucketBy]);

  return { chartData, series, byProductMode };
}