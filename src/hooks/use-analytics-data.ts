import { useMemo } from "react";
import { PRODUCT_GROUPS, getGroupForSlug, ProductGroupConfig } from "./use-product-group";
import type { ProductionEntry } from "@/types/production.types";
import type { Product } from "@/types/products.types";

export interface GroupTileData {
  key: string;
  label: string;
  color: ProductGroupConfig["color"];
  actual: number;
  target: number;
  diff: number;
  pct: number | null;
  hasAnyData: boolean;
  productCount: number;
}

export interface ChartPoint {
  date: string;
  [groupLabel: string]: number | string;
}

/**
 * Aggregates raw production entries into:
 * - tiles: one summary per group (actual/target/diff for the whole date range)
 * - chartData: one point per day, with an actual-output value per selected group,
 *   ready to feed straight into a recharts <LineChart>/<BarChart>.
 */
export function useAnalyticsData(
  entries: ProductionEntry[],
  products: Product[],
  selectedGroupKeys: string[]
) {
  const productGroupMap = useMemo(() => {
    const map = new Map<number, ProductGroupConfig | null>();
    products.forEach((p) => map.set(p.id, getGroupForSlug((p as any).slug)));
    return map;
  }, [products]);

  // one tile per group, regardless of current group filter — tiles always show everything
  const tiles: GroupTileData[] = useMemo(() => {
    return PRODUCT_GROUPS.map((group) => {
      const groupProductIds = products
        .filter((p) => getGroupForSlug((p as any).slug)?.key === group.key)
        .map((p) => p.id);

      const groupEntries = entries.filter((e) => groupProductIds.includes(e.product_id));

      const actual = groupEntries.reduce((s, e) => s + Number(e.actual_output || 0), 0);
      const target = groupEntries.reduce((s, e) => s + Number(e.target_output || 0), 0);
      const hasAnyData = groupEntries.some((e) => Number(e.actual_output) > 0);
      const diff = actual - target;
      const pct = target > 0 ? (diff / target) * 100 : null;

      return {
        key: group.key,
        label: group.label,
        color: group.color,
        actual,
        target,
        diff,
        pct,
        hasAnyData,
        productCount: groupProductIds.length,
      };
    }).filter((t) => t.productCount > 0);
  }, [entries, products]);

  // chart only reflects the groups currently checked in the filter
  const chartData: ChartPoint[] = useMemo(() => {
    const byDate = new Map<string, ChartPoint>();

    entries.forEach((e) => {
      const group = productGroupMap.get(e.product_id);
      if (!group) return;
      if (selectedGroupKeys.length > 0 && !selectedGroupKeys.includes(group.key)) return;

      const date = e.production_date.slice(0, 10);
      if (!byDate.has(date)) byDate.set(date, { date });
      const point = byDate.get(date)!;
      const current = (point[group.label] as number) || 0;
      point[group.label] = current + Number(e.actual_output || 0);
    });

    return Array.from(byDate.values()).sort((a, b) =>
      (a.date as string).localeCompare(b.date as string)
    );
  }, [entries, productGroupMap, selectedGroupKeys]);

  const chartGroups = useMemo(
    () =>
      PRODUCT_GROUPS.filter(
        (g) => selectedGroupKeys.length === 0 || selectedGroupKeys.includes(g.key)
      ),
    [selectedGroupKeys]
  );

  return { tiles, chartData, chartGroups };
}