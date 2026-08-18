import { useEffect, useMemo, useState } from "react";
import { productionService } from "@/services/production.service";
import type { ProductionEntry } from "@/types/production.types";

export function useMultiMonthEntries(months: string[]) {
  const [entriesByMonth, setEntriesByMonth] = useState<Record<string, ProductionEntry[]>>({});
  const [loading, setLoading] = useState(false);

  const monthsKey = [...months].sort().join(",");

  useEffect(() => {
    if (months.length === 0) {
      setEntriesByMonth({});
      return;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all(
      months.map((m) => productionService.getByMonth(m).then((data) => [m, data] as const))
    )
      .then((results) => {
        if (cancelled) return;
        const map: Record<string, ProductionEntry[]> = {};
        results.forEach(([m, data]) => (map[m] = data));
        setEntriesByMonth(map);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthsKey]);

  const entries = useMemo(() => Object.values(entriesByMonth).flat(), [entriesByMonth]);

  return { entries, loading };
}