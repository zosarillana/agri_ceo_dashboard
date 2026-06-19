import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  CardHeader,
  CardTimestamp,
  HistoricalBadge,
  AnimatedCard,
  ExpandRow,
} from "./shared-dashboard-ui";
import {
  fmt,
  fmtUSD,
  fmtMonthLabel,
  currentMonthKey,
  toMonthKey,
} from "@/lib/dashboard-utils";

const expandVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: { height: "auto", opacity: 1 },
};

export function SalesCard({
  active,
  index,
  thisMonth,
  lastMonth,
  momChangePct,
  monthlyBreakdown,
  timeLabel,
  dateLabel,
  selectedMonthKey,
  basePath,
}: {
  active: boolean;
  index: number;
  thisMonth: {
    total_usd: number;
    total_kg: number;
    entry_count: number;
    export_count: number;
    local_count: number;
  };
  lastMonth: { total_usd: number; total_kg: number; entry_count: number };
  momChangePct: number | null;
  monthlyBreakdown: Array<{
    month: string;
    total_usd: number;
    total_kg: number;
    entry_count: number;
  }>;
  timeLabel: string;
  dateLabel: string;
  selectedMonthKey: string;
  basePath?: string;
}) {
  const [expanded, setExpanded] = React.useState(false);

  const isCurrentMonth = selectedMonthKey === currentMonthKey();
  const isHistorical = !isCurrentMonth;

  const histEntry = React.useMemo(
    () => monthlyBreakdown.find((m) => m.month === selectedMonthKey),
    [monthlyBreakdown, selectedMonthKey],
  );

  const displayUsd = isCurrentMonth
    ? thisMonth.total_usd
    : (histEntry?.total_usd ?? null);
  const displayKg = isCurrentMonth
    ? thisMonth.total_kg
    : (histEntry?.total_kg ?? null);
  const displayEntries = isCurrentMonth
    ? thisMonth.entry_count
    : (histEntry?.entry_count ?? null);
  const displayExport = isCurrentMonth ? thisMonth.export_count : null;
  const displayLocal = isCurrentMonth ? thisMonth.local_count : null;
  const displayMonthLabel = fmtMonthLabel(selectedMonthKey);

  const lastMonthKey = React.useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 1);
    return toMonthKey(d.toLocaleDateString("en-CA"));
  }, []);

  const momLabel =
    momChangePct != null
      ? `${momChangePct >= 0 ? "+" : ""}${momChangePct}% vs last month`
      : "No prior month data";

  return (
    <AnimatedCard index={index}>
      <Card
        className={`transition-all hover:shadow-md ${active ? "border-primary" : ""}`}
      >
        <CardContent className="px-5 py-4 space-y-3">
          <div
            className="flex justify-between cursor-pointer"
            onClick={() => setExpanded((v) => !v)}
          >
            <div className="flex grid grid-col-1">
              <CardHeader
                color="green"
                icon={TrendingUp}
                label="Sales"
                summary={`${displayEntries ?? "—"} entries · ${displayMonthLabel} (Filtered Monthly)`}
              />
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {isCurrentMonth && (
                  <>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-500/10">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      <span className="text-[10px] font-medium text-green-700 dark:text-green-400">
                        Export
                      </span>
                      <span className="text-[10px] font-bold text-green-700 dark:text-green-400">
                        {displayExport}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      <span className="text-[10px] font-medium text-blue-700 dark:text-blue-400">
                        Local
                      </span>
                      <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400">
                        {displayLocal}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-medium ${
                        momChangePct == null
                          ? "text-muted-foreground"
                          : momChangePct >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {momLabel}
                    </span>
                  </>
                )}
                {isHistorical && <HistoricalBadge label={displayMonthLabel} />}
                {displayKg != null && (
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    · {fmt(displayKg)} kg
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">
                {displayUsd != null ? fmtUSD(displayUsd) : "—"}
              </p>
              <p className="text-xs text-muted-foreground">total sales</p>
              <CardTimestamp timeLabel={timeLabel} dateLabel={dateLabel} />
            </div>
          </div>

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                key="sales-expanded"
                variants={expandVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="pt-3 border-t border-border/50 space-y-3">
                  {/* Core metrics */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        Total (USD)
                      </p>
                      <p className="text-sm font-semibold">
                        {displayUsd != null ? fmtUSD(displayUsd) : "—"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        Volume
                      </p>
                      <p className="text-sm font-semibold">
                        {displayKg != null ? `${fmt(displayKg)} kg` : "—"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        Entries
                      </p>
                      <p className="text-sm font-semibold">
                        {displayEntries  ?? "—"}
                      </p>
                    </div>
                  </div>

                  {/* Export / Local breakdown — current month only */}
                  {isCurrentMonth && (
                    <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/30">
                      <div className="space-y-1">
                        <p className="text-[10px] text-green-600 dark:text-green-400 uppercase tracking-wide font-medium">
                          Export
                        </p>
                        <p className="text-sm font-semibold">
                          {displayExport} entries
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-wide font-medium">
                          Local
                        </p>
                        <p className="text-sm font-semibold">
                          {displayLocal} entries
                        </p>
                      </div>
                    </div>
                  )}

                  {/* No data fallback for historical months */}
                  {isHistorical && !histEntry && (
                    <p className="text-[10px] text-muted-foreground italic">
                      No sales data for {displayMonthLabel}.
                    </p>
                  )}

                  {/* Last month comparison — current month only */}
                  {isCurrentMonth && (
                    <div className="flex justify-between items-center pt-1 border-t border-border/30">
                      <span className="text-[10px] text-muted-foreground">
                        Last Month ({fmtMonthLabel(lastMonthKey)})
                      </span>
                      <span className="text-xs font-medium">
                        {fmtUSD(lastMonth.total_usd)}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <ExpandRow
            id="sales"
            expanded={expanded}
            onToggle={() => setExpanded((v) => !v)}
            basePath={basePath}
          />
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}