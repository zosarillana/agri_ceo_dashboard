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
  // A darker shade of `color`, used for the target line so it reads as
  // visually distinct from its matching bar rather than blending into it.
  lineColor: string;
  // CSS-variable-safe data keys — no spaces or special characters, since
  // these get interpolated straight into `--color-${key}` CSS custom
  // property names. A property name with a space (e.g. from "Group 1" or
  // "Processed Nuts") is invalid CSS and gets silently dropped, which is
  // why bars/lines were rendering black — the color variable never
  // existed under that name.
  actualKey: string;
  targetKey: string;
}

export interface ChartPoint {
  date: string;
  [dataKey: string]: number | string;
}

export interface UseAnalyticsChartResult {
  chartData: ChartPoint[];
  series: ChartSeriesConfig[];
  byProductMode: boolean;
}

export type ChartBucket = "day" | "month";

// Strips everything except letters, numbers, hyphens and underscores so
// the result is always a valid CSS custom-property identifier.
function toSafeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Darkens a #rrggbb hex color by `amount` (0–1, where 0 = unchanged and
// 1 = black), used so a series' line reads as a deeper shade of its own
// bar color instead of matching it exactly.
function darkenColor(hex: string, amount = 0.40): string {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!match) return hex;
  const [, rHex, gHex, bHex] = match;
  const scale = (component: string) =>
    Math.max(0, Math.round(parseInt(component, 16) * (1 - amount)));
  const r = scale(rHex).toString(16).padStart(2, "0");
  const g = scale(gHex).toString(16).padStart(2, "0");
  const b = scale(bHex).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

/**
 * Builds combo-chart series + data points, bucketed either by day or by
 * month. Each series (one per selected PRODUCT, or one per GROUP if no
 * products are selected) carries two metrics per bucket:
 *   - actual_output, summed — meant to render as a Bar
 *   - dly_target, summed — meant to render as a Line overlay, in a
 *     darker shade of the same series' bar color
 *
 * Every series/bucket combination is backfilled to 0 (not left
 * `undefined`) so lines draw continuously across the full date range
 * instead of visibly starting/stopping wherever a series happens to have
 * no entries for a particular day.
 *
 * dly_yield, mtd_target, and mtd_yield are still NOT charted: dly_yield/
 * mtd_yield are percentages already derived from actual/target, and
 * mtd_* figures are cumulative-as-of-day so they don't sum sensibly
 * across a bucketed date range the way actual_output/dly_target do.
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
        .map((p, i) => {
          const safe = toSafeKey(p.name) || `product-${p.id}`;
          const color = PRODUCT_PALETTE[i % PRODUCT_PALETTE.length];
          return {
            key: String(p.id),
            label: p.name,
            color,
            lineColor: darkenColor(color),
            actualKey: `${safe}-actual`,
            targetKey: `${safe}-target`,
          };
        });
    }
    return PRODUCT_GROUPS.filter(
      (g) => selectedGroupKeys.length === 0 || selectedGroupKeys.includes(g.key)
    ).map((g) => ({
      key: g.key,
      label: g.label,
      color: g.color.hex,
      lineColor: darkenColor(g.color.hex),
      actualKey: `${g.key}-actual`,
      targetKey: `${g.key}-target`,
    }));
  }, [byProductMode, products, selectedProductIds, selectedGroupKeys]);

  // Map from the human-readable series label (used while walking entries)
  // to its safe actual/target keys, so chartData is populated with the
  // same keys `series` declares — built once per `series` change.
  const keysByLabel = useMemo(() => {
    const map = new Map<string, { actualKey: string; targetKey: string }>();
    series.forEach((s) => map.set(s.label, { actualKey: s.actualKey, targetKey: s.targetKey }));
    return map;
  }, [series]);

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

      const keys = keysByLabel.get(seriesLabel);
      if (!keys) return; // series filtered out / not yet in keysByLabel

      const bucketKey =
        bucketBy === "month"
          ? e.production_date.slice(0, 7) // "YYYY-MM"
          : e.production_date.slice(0, 10); // "YYYY-MM-DD"

      if (!byBucket.has(bucketKey)) byBucket.set(bucketKey, { date: bucketKey });
      const point = byBucket.get(bucketKey)!;

      point[keys.actualKey] = ((point[keys.actualKey] as number) || 0) + Number(e.actual_output || 0);
      point[keys.targetKey] = ((point[keys.targetKey] as number) || 0) + Number(e.dly_target || 0);
    });

    // Backfill every series' actual/target keys across every bucket so
    // lines never visibly break — a day with no data for a series
    // becomes an explicit 0, not a missing key.
    const buckets = Array.from(byBucket.values());
    buckets.forEach((point) => {
      series.forEach((s) => {
        if (point[s.actualKey] === undefined) point[s.actualKey] = 0;
        if (point[s.targetKey] === undefined) point[s.targetKey] = 0;
      });
    });

    return buckets.sort((a, b) => (a.date as string).localeCompare(b.date as string));
  }, [entries, products, byProductMode, selectedProductIds, selectedGroupKeys, bucketBy, keysByLabel, series]);

  return { chartData, series, byProductMode };
}