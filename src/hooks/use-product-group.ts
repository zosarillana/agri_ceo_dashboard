import { useMemo } from "react";

export type ProductGroupKey =
  | "group-1"
  | "group-2"
  | "group-3"
  | "ungrouped";

export interface ProductGroupConfig {
  key: ProductGroupKey;
  label: string;
  color: {
    dot: string;
    badge: string;
    border: string;
    hex: string;
  };
  slugs: string[];
  // Optional: if provided, the group's subtotal is computed ONLY from these
  // slugs instead of summing every item in `slugs`. Use this when some items
  // in the group are themselves a sum of other items in the same group
  // (e.g. "Total Packed Cream" already equals the 8 packaging lines below it),
  // so summing everything would double-count.
  subtotalSlugs?: string[];
}

export const PRODUCT_GROUPS: ProductGroupConfig[] = [
  {
    key: "group-1",
    label: "Group 1",
    color: {
      dot: "bg-yellow-400",
      badge: "bg-yellow-500/10 text-yellow-700",
      border: "border-l-yellow-400",
      hex: "#eab308",
    },
    slugs: [
      "processed-nuts",
      "pared-meat",
      "dc-produced",
      "vco-produced-unfiltered",
      "flour-produced",
    ],
  },
  {
    key: "group-2",
    label: "Group 2",
    color: {
      dot: "bg-blue-400",
      badge: "bg-blue-500/10 text-blue-700",
      border: "border-l-blue-400",
      hex: "#3b82f6",
    },
    // all 10 rows still display in the table, in this order
    slugs: [
      "diluted-extracted-cream-30",
      "fpcc-manual-fillingpacking",
      "aseptic-17-packed-bib",
      "aseptic-17-packed-bid",
      "aseptic-24-packed-bib",
      "aseptic-24-packed-bid",
      "aseptic-30-packed-bib",
      "aseptic-30-packed-1t-tote-bag",
      "aseptic-30-packed-bid",
      "total-packed-cream",
    ],
    // but the subtotal only sums Diluted + Total Packed Cream, since
    // Total Packed Cream already equals the sum of the 8 packaging lines above —
    // including both would double-count them.
    subtotalSlugs: ["diluted-extracted-cream-30", "total-packed-cream"],
  },
  {
    key: "group-3",
    label: "Group 3",
    color: {
      dot: "bg-pink-400",
      badge: "bg-pink-500/10 text-pink-700",
      border: "border-l-pink-400",
      hex: "#ec4899",
    },
    slugs: ["raw-cocowater", "fcwc", "acwc"],
  },
];

const SLUG_TO_GROUP: Record<string, ProductGroupConfig> = PRODUCT_GROUPS.reduce(
  (acc, group) => {
    group.slugs.forEach((slug) => (acc[slug] = group));
    return acc;
  },
  {} as Record<string, ProductGroupConfig>
);

export function getGroupForSlug(
  slug: string | undefined | null
): ProductGroupConfig | null {
  if (!slug) return null;
  return SLUG_TO_GROUP[slug] ?? null;
}

export interface Groupable {
  slug?: string | null;
  actual?: number | null;
  target?: number | null;
  hasActualData?: boolean;
  [key: string]: any;
}

export interface GroupTotals {
  actual: number;
  target: number;
  diff: number;
  pct: number | null;
  hasAnyData: boolean;
}

export interface GroupedResult<T> {
  key: ProductGroupKey;
  label: string;
  color: ProductGroupConfig["color"];
  items: T[];
  totals: GroupTotals;
  subtotalLabel: string;
}

function computeTotals(items: Groupable[]): GroupTotals {
  let actual = 0;
  let target = 0;
  let hasAnyData = false;

  for (const item of items) {
    if (item.hasActualData && typeof item.actual === "number") {
      actual += item.actual;
      hasAnyData = true;
    }
    if (typeof item.target === "number") {
      target += item.target;
    }
  }

  const diff = actual - target;
  const pct = target > 0 ? (diff / target) * 100 : null;

  return { actual, target, diff, pct, hasAnyData };
}

export interface UseProductGroupsResult<T> {
  groups: GroupedResult<T>[];
  grandTotal: GroupTotals;
}

/**
 * Groups any array of items that have a `slug` field according to
 * PRODUCT_GROUPS, sorted to match the order slugs were listed. Computes
 * one subtotal per group (labelled "Subtotal (Group N)") — normally the
 * sum of every item in the group, but if a group defines `subtotalSlugs`,
 * only those slugs are summed (to avoid double-counting when one item is
 * itself a rollup of others in the same group). Also computes a grand
 * total across everything, using each group's subtotal (not a raw sum of
 * every displayed item) so the grand total doesn't inherit any
 * double-counting either. Anything not in the config falls into
 * "Ungrouped" at the end. Empty groups are skipped.
 */
export function useProductGroups<T extends Groupable>(
  items: T[]
): UseProductGroupsResult<T> {
  return useMemo(() => {
    const buckets = new Map<ProductGroupKey, T[]>();

    for (const group of PRODUCT_GROUPS) {
      buckets.set(group.key, []);
    }

    const ungrouped: T[] = [];

    for (const item of items) {
      const group = getGroupForSlug(item.slug);
      if (group) buckets.get(group.key)!.push(item);
      else ungrouped.push(item);
    }

    const groups: GroupedResult<T>[] = PRODUCT_GROUPS.map((g) => {
      const groupItems = buckets.get(g.key)!;

      // keep items in the exact order their slugs were listed in PRODUCT_GROUPS
      const sortedItems = [...groupItems].sort((a, b) => {
        const aIndex = g.slugs.indexOf(a.slug ?? "");
        const bIndex = g.slugs.indexOf(b.slug ?? "");
        return aIndex - bIndex;
      });

      // subtotal uses subtotalSlugs if defined, otherwise every item shown
      const subtotalItems = g.subtotalSlugs
        ? sortedItems.filter((i) => g.subtotalSlugs!.includes(i.slug ?? ""))
        : sortedItems;

      return {
        key: g.key,
        label: g.label,
        color: g.color,
        items: sortedItems,
        totals: computeTotals(subtotalItems),
        subtotalLabel: `Subtotal (${g.label})`,
      };
    }).filter((g) => g.items.length > 0);

    if (ungrouped.length > 0) {
      groups.push({
        key: "ungrouped",
        label: "Ungrouped",
        color: {
          dot: "bg-gray-400",
          badge: "bg-gray-500/10 text-gray-700",
          border: "border-l-gray-300",
          hex: "#9ca3af",
        },
        items: ungrouped,
        totals: computeTotals(ungrouped),
        subtotalLabel: "Subtotal (Ungrouped)",
      });
    }

    // grand total = sum of each group's already-correct subtotal,
    // NOT a raw sum of every item — this keeps Group 2's dedup intact
    let grandActual = 0;
    let grandTarget = 0;
    let grandHasAnyData = false;
    for (const g of groups) {
      if (g.totals.hasAnyData) {
        grandActual += g.totals.actual;
        grandHasAnyData = true;
      }
      grandTarget += g.totals.target;
    }
    const grandDiff = grandActual - grandTarget;
    const grandPct = grandTarget > 0 ? (grandDiff / grandTarget) * 100 : null;
    const grandTotal: GroupTotals = {
      actual: grandActual,
      target: grandTarget,
      diff: grandDiff,
      pct: grandPct,
      hasAnyData: grandHasAnyData,
    };

    return { groups, grandTotal };
  }, [items]);
}