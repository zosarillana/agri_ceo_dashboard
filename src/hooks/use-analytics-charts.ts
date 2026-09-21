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
  // The color-wheel opposite (complementary hue) of `color`, boosted for
  // vibrancy — used for the target line so it visually pops against its
  // matching bar instead of just being a duller/darker version of it.
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

function hexToHsl(hex: string): [number, number, number] {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!match) return [0, 0, 0];
  const r = parseInt(match[1], 16) / 255;
  const g = parseInt(match[2], 16) / 255;
  const b = parseInt(match[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }
  return [h, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  const toHex = (v: number) =>
    Math.round((v + m) * 255).toString(16).padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Returns the color-wheel opposite of `hex` (hue rotated 180°), with
// saturation and lightness pushed toward vibrant/bright rather than a
// muted complementary tone — meant for a line that visually pops against
// its matching bar color instead of blending or looking washed out.
function complementaryColor(hex: string): string {
  const [h, , l] = hexToHsl(hex);
  const complementHue = h + 180;
  const brightSaturation = 0.85; // vivid, not pastel
  // Keep lightness in a punchy-but-visible band regardless of the base
  // color's own lightness, so the line reads clearly on both light/dark
  // chart backgrounds.
  const brightLightness = Math.min(0.65, Math.max(0.45, l));
  return hslToHex(complementHue, brightSaturation, brightLightness);
}

/**
 * Builds combo-chart series + data points, bucketed either by day or by
 * month. Each series (one per selected PRODUCT, or one per GROUP if no
 * products are selected) carries two metrics per bucket:
 *   - actual_output, summed — meant to render as a Bar
 *   - dly_target, summed — meant to render as a Line overlay, in the
 *     complementary (color-wheel opposite) hue of the bar, boosted for
 *     vibrancy
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
            lineColor: complementaryColor(color),
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
      lineColor: complementaryColor(g.color.hex),
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