import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CardHeader, 
  CardTimestamp, 
  HistoricalBadge, 
  AnimatedCard, 
  ExpandRow 
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
    ? currentMonth.has_data ? currentMonth.total_billed : null
    : isPreviousMonth
      ? previousMonth.has_data ? previousMonth.total_billed : null
      : (trendEntry?.total_billed ?? null);

  const displayKw = isCurrentMonth
    ? currentMonth.has_data ? currentMonth.total_kw : null
    : (trendEntry?.total_kw ?? null);

  const displayAcc2 = isCurrentMonth && currentMonth.has_data ? currentMonth.account2_billed : null;
  const displayAcc3 = isCurrentMonth && currentMonth.has_data ? currentMonth.account3_billed : null;

  const momLabel =
    momChangePct != null
      ? `${momChangePct >= 0 ? "+" : ""}${momChangePct}% vs last month`
      : "No prior month data";

  return (
    <AnimatedCard index={index}>
      <Card className={`transition-all hover:shadow-md ${active ? "border-primary" : ""}`}>
        <CardContent className="px-5 py-4 space-y-3">
          <div className="flex justify-between cursor-pointer" onClick={() => setExpanded((v) => !v)}>
            <CardHeader color="amber" icon={Zap} label="Energy" summary={`${displayLabel} · YTD ${fmtPHP(ytdTotal)}`} />
            <div className="text-right">
              <p className="text-2xl font-bold">{displayBilled != null ? fmtPHP(displayBilled) : "—"}</p>
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
              <motion.div key="energy-expanded" variants={expandVariants} initial="collapsed" animate="expanded" exit="collapsed" className="overflow-hidden">
                <div className="pt-3 border-t border-border/50 space-y-2">
                   {/* ... content truncated for brevity ... */}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <ExpandRow id="energy" expanded={expanded} onToggle={() => setExpanded((v) => !v)} />
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}