import { useEffect, useMemo, useState } from "react";
import { useProductionStore } from "@/store/production.store";
import type { Product } from "@/types/products.types";
import type { ProductionEntry } from "@/types/production.types";

export interface RangeViewItem {
  id: number;
  slug?: string | null;
  label: string;
  actual: number | null;
  target: number;
  dly_target: number;
  dly_yield: number | null;
  mtd_target: number | null;
  mtd_yield: number | null;
  mtd_total: number | null;
  unit: string;
  hasEntry: boolean;
  hasActualData: boolean;
  daysWithData: number;
}

export type RangeMode = "range" | "month";

function toISO(d: Date): string {
  return d.toLocaleDateString("en-CA");
}

function toMonthStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// mtdEntries is a SEPARATE array from the main range/month-scoped
// `entries` — always "day 1 of the relevant month through asOfDate",
// fetched independently (see production.store.ts: fetchMtd). This is
// what makes mtd_total correct even when the person is viewing a single
// day: filtering to Sept 15 alone no longer collapses mtd_total down to
// just that one day's actual_output, because mtd_total is summed from
// this separate, always-full-month-so-far array instead of from
// whatever `entries` happens to currently hold.
export function aggregateViewItems(
  products: Product[],
  entries: ProductionEntry[],
  mtdEntries: ProductionEntry[] = [],
): RangeViewItem[] {
  return products.map((pr) => {
    const productEntries = entries.filter((e) => e.product_id === pr.id);
    const daysWithData = productEntries.filter(
      (e) => e.actual_output > 0,
    ).length;
    const actualSum = productEntries.reduce(
      (sum, e) => sum + Number(e.actual_output || 0),
      0,
    );
    const targetSum =
      productEntries.length > 0
        ? productEntries.reduce(
            (sum, e) => sum + Number(e.target_output || 0),
            0,
          )
        : (pr.default_target ?? 0);

    // dly_target behaves like target_output — a per-day figure, summable
    // across the range to give a total target for the period.
    const dlyTargetSum = productEntries.reduce(
      (sum, e) => sum + Number(e.dly_target || 0),
      0,
    );

    // dly_yield is a percentage — summing across days is meaningless, so we
    // average it across days that actually have a value.
    const dlyYieldEntries = productEntries.filter(
      (e) => e.dly_yield !== null && e.dly_yield !== undefined,
    );
    const dlyYieldAvg =
      dlyYieldEntries.length > 0
        ? dlyYieldEntries.reduce((sum, e) => sum + Number(e.dly_yield), 0) /
          dlyYieldEntries.length
        : null;

    // mtd_target / mtd_yield are already cumulative as of each entry's own
    // date, so summing across multiple days in a range double-counts. Use
    // the value from the latest dated entry in the range instead.
    const sortedProductEntries = [...productEntries].sort((a, b) =>
      a.production_date.localeCompare(b.production_date),
    );
    const latestEntry = sortedProductEntries[sortedProductEntries.length - 1];

    // mtd_total: sum of actual_output from mtdEntries — a separately
    // fetched, always-complete "day 1 of month through as-of-date" array
    // (see fetchMtd in production.store.ts). This gives you an
    // independently computed running total to cross-check against
    // whatever mtd_target/mtd_yield the sheet itself reported, and it
    // stays correct regardless of what date range the main view happens
    // to be filtered to.
    const mtdProductEntries = mtdEntries.filter((e) => e.product_id === pr.id);
    const mtdTotal =
      mtdProductEntries.length > 0
        ? mtdProductEntries.reduce(
            (sum, e) => sum + Number(e.actual_output || 0),
            0,
          )
        : null;

    return {
      id: pr.id,
      slug: pr.slug,
      label: pr.name,
      actual: daysWithData > 0 ? actualSum : null,
      target: targetSum,
      dly_target: dlyTargetSum,
      dly_yield: dlyYieldAvg,
      mtd_target: latestEntry ? Number(latestEntry.mtd_target ?? 0) : null,
      mtd_yield: latestEntry ? Number(latestEntry.mtd_yield ?? 0) : null,
      mtd_total: mtdTotal,
      unit: pr.unit ?? "—",
      hasEntry: productEntries.length > 0,
      hasActualData: daysWithData > 0,
      daysWithData,
    };
  });
}

export function useProductionRange(products: Product[], initialFrom?: Date, initialTo?: Date) {
  const today = useMemo(() => new Date(), []);
  const [mode, setMode] = useState<RangeMode>("range");
  const [from, setFromRaw] = useState<Date>(initialFrom ?? today);
  const [to, setToRaw] = useState<Date>(initialTo ?? today);
  const [month, setMonth] = useState<Date>(today);

  const { entries, mtdEntries, loading, fetchByRange, fetchByMonth, fetchMtd } =
    useProductionStore();

  const fromISO = toISO(from);
  const toISOStr = toISO(to);
  const monthStr = toMonthStr(month);
  const isSingleDay = mode === "range" && fromISO === toISOStr;

  // The date MTD should be "as of": in range mode, the end of the
  // selected range; in month mode, the end of the selected month.
  const mtdAsOfISO = mode === "month" ? `${monthStr}-01` : toISOStr;
  // For month mode we actually want the LAST day being viewed, not the
  // 1st — recompute properly below via a real Date so month length is
  // handled correctly (28/29/30/31 days).
  const mtdAsOf = useMemo(() => {
    if (mode === "month") {
      // last day of the selected month
      return toISO(new Date(month.getFullYear(), month.getMonth() + 1, 0));
    }
    return toISOStr;
  }, [mode, month, toISOStr]);

  useEffect(() => {
    if (products.length === 0) return;
    if (mode === "month") {
      fetchByMonth(monthStr);
    } else {
      fetchByRange(fromISO, toISOStr);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length, mode, fromISO, toISOStr, monthStr]);

  // Independent MTD fetch — always day 1 of the relevant month through
  // mtdAsOf, regardless of what the main range/month fetch above loaded.
  useEffect(() => {
    if (products.length === 0) return;
    fetchMtd(mtdAsOf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length, mtdAsOf]);

  function setFrom(date: Date | undefined) {
    if (!date) return;
    setFromRaw(date);
    if (date > to) setToRaw(date);
  }

  function setTo(date: Date | undefined) {
    if (!date) return;
    setToRaw(date);
    if (date < from) setFromRaw(date);
  }

  function goToPreviousMonth() {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }

  const isCurrentMonth =
    month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth();

  const viewItems: RangeViewItem[] = useMemo(
    () => aggregateViewItems(products, entries, mtdEntries),
    [products, entries, mtdEntries]
  );

  return {
    mode,
    setMode,
    from,
    to,
    setFrom,
    setTo,
    month,
    setMonth,
    goToPreviousMonth,
    goToNextMonth,
    isCurrentMonth,
    fromISO,
    toISO: toISOStr,
    monthStr,
    isSingleDay,
    viewItems,
    loading,
  };
}