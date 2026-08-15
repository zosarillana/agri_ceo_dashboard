import { useEffect, useMemo, useState } from "react";
import { useProductionStore } from "@/store/production.store";
import type { Product } from "@/types/products.types";

export interface RangeViewItem {
  id: number;
  slug?: string | null;
  label: string;
  actual: number | null;
  target: number;
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

export function useProductionRange(products: Product[], initialFrom?: Date, initialTo?: Date) {
  const today = useMemo(() => new Date(), []);
  const [mode, setMode] = useState<RangeMode>("range");
  const [from, setFromRaw] = useState<Date>(initialFrom ?? today);
  const [to, setToRaw] = useState<Date>(initialTo ?? today);
  const [month, setMonth] = useState<Date>(today); // any date within the target month

  const { entries, loading, fetchByRange, fetchByMonth } = useProductionStore();

  const fromISO = toISO(from);
  const toISOStr = toISO(to);
  const monthStr = toMonthStr(month);
  const isSingleDay = mode === "range" && fromISO === toISOStr;

  useEffect(() => {
    if (products.length === 0) return;
    if (mode === "month") {
      fetchByMonth(monthStr);
    } else {
      fetchByRange(fromISO, toISOStr);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length, mode, fromISO, toISOStr, monthStr]);

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

  const viewItems: RangeViewItem[] = useMemo(() => {
    return products.map((pr) => {
      const productEntries = entries.filter((e) => e.product_id === pr.id);
      const daysWithData = productEntries.filter((e) => e.actual_output > 0).length;
      const actualSum = productEntries.reduce(
        (sum, e) => sum + Number(e.actual_output || 0),
        0
      );
      const targetSum =
        productEntries.length > 0
          ? productEntries.reduce((sum, e) => sum + Number(e.target_output || 0), 0)
          : pr.default_target ?? 0;

      return {
        id: pr.id,
        slug: pr.slug,
        label: pr.name,
        actual: daysWithData > 0 ? actualSum : null,
        target: targetSum,
        unit: pr.unit ?? "—",
        hasEntry: productEntries.length > 0,
        hasActualData: daysWithData > 0,
        daysWithData,
      };
    });
  }, [products, entries]);

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