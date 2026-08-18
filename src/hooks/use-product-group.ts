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
  // Optional extra computed subtotal(s) shown below a group's rows —
  // e.g. Group 2 wants "Diluted + Total Packed Cream" as its own line.
  highlightSubtotals?: {
    label: string;
    slugs: string[];
  }[];
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
    highlightSubtotals: [
      {
        // Computed independently of the raw "total-packed-cream" product entry —
        // this sums the actual packaging line items instead.
        label: "Total Packed Cream (computed)",
        slugs: [
          "fpcc-manual-fillingpacking",
          "aseptic-17-packed-bib",
          "aseptic-17-packed-bid",
          "aseptic-24-packed-bib",
          "aseptic-24-packed-bid",
          "aseptic-30-packed-bib",
          "aseptic-30-packed-1t-tote-bag",
          "aseptic-30-packed-bid",
        ],
      },
      {
        label: "Group 2 — Subtotal (Diluted Extracted Cream 30% + Total Packed Cream)",
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
        ],
      },
    ],
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

export interface HighlightSubtotal {
  label: string;
  totals: GroupTotals;
}

export interface GroupedResult<T> {
  key: ProductGroupKey;
  label: string;
  color: ProductGroupConfig["color"];
  items: T[];
  totals: GroupTotals;
  highlightSubtotals: HighlightSubtotal[];
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
 * PRODUCT_GROUPS, and computes actual/target subtotals per group plus
 * a grand total across everything. Groups can also define
 * `highlightSubtotals` — extra named sums over a subset of their own
 * slugs (e.g. Group 2's "Diluted + Total Packed Cream" line).
 * Anything not in the config falls into "Ungrouped" at the end.
 * Empty groups are skipped.
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

      const highlightSubtotals: HighlightSubtotal[] = (g.highlightSubtotals ?? []).map(
        (h) => ({
          label: h.label,
          totals: computeTotals(groupItems.filter((i) => h.slugs.includes(i.slug ?? ""))),
        })
      );

      return {
        key: g.key,
        label: g.label,
        color: g.color,
        items: groupItems,
        totals: computeTotals(groupItems),
        highlightSubtotals,
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
        highlightSubtotals: [],
      });
    }

    const grandTotal = computeTotals(items);

    return { groups, grandTotal };
  }, [items]);
}