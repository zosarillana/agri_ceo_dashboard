import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  CardHeader,
  CardTimestamp,
  HistoricalBadge,
  AnimatedCard,
  ExpandRow,
} from "./shared-dashboard-ui";
import { fmt, fmtPHP, fmtMonthLabel } from "@/lib/dashboard-utils";

const expandVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: { height: "auto", opacity: 1 },
};

export function EnergyCard({
  active,
  index,
  currentMonth,
  previousMonth,
  momChangePct,
  ytdTotal,
  timeLabel,
  dateLabel,
  selectedMonthKey,
  monthlyTrends,
  basePath,
}: {
  active: boolean;
  index: number;
  currentMonth: {
    month: string;
    total_billed: number;
    total_kw: number;
    account2_billed: number;
    account3_billed: number;
    has_data: boolean;
  };
  previousMonth: { month: string; total_billed: number; has_data: boolean };
  momChangePct: number | null;
  ytdTotal: number;
  timeLabel: string;
  dateLabel: string;
  selectedMonthKey: string;
  monthlyTrends: Array<{
    month: string;
    total_billed: number;
    total_kw: number;
    total_demand: number;
  }>;
  basePath?: string;
}) {
  const [expanded, setExpanded] = React.useState(false);

  const isCurrentMonth = selectedMonthKey === currentMonth.month;
  const isPreviousMonth = selectedMonthKey === previousMonth.month;

  const trendEntry = React.useMemo(
    () => monthlyTrends.find((t) => t.month === selectedMonthKey),
    [monthlyTrends, selectedMonthKey],
  );

  const displayLabel = fmtMonthLabel(selectedMonthKey);
  const isHistorical = !isCurrentMonth;

  const displayBilled = isCurrentMonth
    ? currentMonth.has_data
      ? currentMonth.total_billed
      : null
    : isPreviousMonth
      ? previousMonth.has_data
        ? previousMonth.total_billed
        : null
      : (trendEntry?.total_billed ?? null);

  const displayKw = isCurrentMonth
    ? currentMonth.has_data
      ? currentMonth.total_kw
      : null
    : (trendEntry?.total_kw ?? null);

  const displayAcc2 =
    isCurrentMonth && currentMonth.has_data
      ? currentMonth.account2_billed
      : null;
  const displayAcc3 =
    isCurrentMonth && currentMonth.has_data
      ? currentMonth.account3_billed
      : null;

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
            <CardHeader
              color="amber"
              icon={Zap}
              label="Energy"
              summary={`${displayLabel} · YTD ${fmtPHP(ytdTotal)}`}
            />
            <div className="text-right">
              <p className="text-2xl font-bold">
                {displayBilled != null ? fmtPHP(displayBilled) : "—"}
              </p>
              <p className="text-xs text-muted-foreground">total billed</p>
              {isHistorical && (
                <div className="flex justify-end mt-1">
                  <HistoricalBadge label={displayLabel} />
                </div>
              )}
              <CardTimestamp timeLabel={timeLabel} dateLabel={dateLabel} />
            </div>
          </div>

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                key="energy-expanded"
                variants={expandVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="pt-3 border-t border-border/50 space-y-2">
                  {/* Month label + MoM change */}
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                      {displayLabel}
                    </span>
                    {isCurrentMonth && (
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
                    )}
                  </div>

                  {/* Current month: Account 2 / Account 3 breakdown */}
                  {isCurrentMonth ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground">
                          Account 2
                        </p>
                        <p className="text-sm font-semibold">
                          {displayAcc2 != null ? fmtPHP(displayAcc2) : "—"}
                        </p>
                        {displayKw != null && (
                          <p className="text-[10px] text-muted-foreground">
                            {fmt(displayKw)} kWh
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground">
                          Account 3
                        </p>
                        <p className="text-sm font-semibold">
                          {displayAcc3 != null ? fmtPHP(displayAcc3) : "—"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Historical: Total billed + kWh */
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground">
                          Total Billed
                        </p>
                        <p className="text-sm font-semibold">
                          {displayBilled != null ? fmtPHP(displayBilled) : "—"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground">kWh</p>
                        <p className="text-sm font-semibold">
                          {displayKw != null ? fmt(displayKw) : "—"}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Previous month comparison row — current month only */}
                  {isCurrentMonth && previousMonth.has_data && (
                    <div className="flex justify-between items-center pt-1 border-t border-border/30">
                      <span className="text-[10px] text-muted-foreground">
                        Previous Month ({fmtMonthLabel(previousMonth.month)})
                      </span>
                      <span className="text-xs font-medium">
                        {fmtPHP(previousMonth.total_billed)}
                      </span>
                    </div>
                  )}

                  {/* No data fallback */}
                  {displayBilled == null && (
                    <p className="text-[10px] text-muted-foreground italic">
                      No energy data for {displayLabel}.
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <ExpandRow
            id="energy"
            expanded={expanded}
            onToggle={() => setExpanded((v) => !v)}
            basePath={basePath}
          />
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}