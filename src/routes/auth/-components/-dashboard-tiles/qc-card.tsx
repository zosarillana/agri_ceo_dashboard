import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { FlaskConical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CardHeader, 
  CardTimestamp, 
  HistoricalBadge, 
  AnimatedCard, 
  ExpandRow 
} from "./shared-dashboard-ui";
import { toMonthKey, getTodayISO } from "@/lib/dashboard-utils";

const expandVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: { height: "auto", opacity: 1 },
};

export function QcCard({
  active,
  index,
  qcStats,
  timeLabel,
  dateLabel,
  selectedDateISO,
  basePath,
}: {
  active: boolean;
  index: number;
  qcStats: any;
  timeLabel: string;
  dateLabel: string;
  selectedDateISO: string;
  basePath?: string;
}) {
  const [expanded, setExpanded] = React.useState(false);

  if (!qcStats || !qcStats.current_month) {
    return (
      <AnimatedCard index={index}>
        <Card className={`transition-all hover:shadow-md ${active ? "border-primary" : ""}`}>
          <CardContent className="px-5 py-4">
            <div className="flex justify-between">
              <CardHeader
                color="coral"
                icon={FlaskConical}
                label="Quality Control"
                summary="Loading QC data..."
              />
              <div className="text-right">
                <p className="text-2xl font-bold text-muted-foreground">—</p>
                <p className="text-xs text-muted-foreground">pass rate</p>
                <CardTimestamp timeLabel="—" dateLabel="—" />
              </div>
            </div>
          </CardContent>
        </Card>
      </AnimatedCard>
    );
  }

  const selectedDayData = qcStats.daily_trend?.find((day: any) => {
    const dayDate = day.date.includes("T") ? day.date.split("T")[0] : day.date;
    return dayDate === selectedDateISO;
  });

  const isToday = selectedDateISO === getTodayISO();
  const selectedDateObj = new Date(selectedDateISO + "T00:00:00");

  const hasDailyData = selectedDayData && selectedDayData.tested > 0;
  const displayPassRate = hasDailyData ? selectedDayData.pass_rate : 0;
  const displayTested = hasDailyData ? selectedDayData.tested : 0;
  const displayPassed = hasDailyData ? selectedDayData.passed : 0;
  const displayFailed = hasDailyData ? selectedDayData.failed : 0;

  const selectedMonthKey = toMonthKey(selectedDateISO);
  const monthlyData =
    qcStats.monthly_breakdown?.find((m: any) => m.month === selectedMonthKey) ||
    qcStats.current_month;

  const previousMonthDate = new Date(selectedDateObj);
  previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
  const previousMonthKey = toMonthKey(previousMonthDate.toLocaleDateString("en-CA"));
  const previousMonthlyData = qcStats.monthly_breakdown?.find(
    (m: any) => m.month === previousMonthKey,
  );

  const momChange =
    previousMonthlyData && monthlyData
      ? monthlyData.pass_rate - previousMonthlyData.pass_rate
      : null;

  const productPerformance = qcStats.product_performance || [];

  const trendData = (() => {
    if (!qcStats.daily_trend || qcStats.daily_trend.length === 0) return [];
    const trendsWithProperDates = qcStats.daily_trend.map((day: any) => ({
      ...day,
      date: day.date.includes("T") ? day.date.split("T")[0] : day.date,
    }));
    const selectedIndex = trendsWithProperDates.findIndex((day: any) => day.date === selectedDateISO);
    if (selectedIndex === -1) return trendsWithProperDates.slice(-7);
    const startIndex = Math.max(0, selectedIndex - 6);
    return trendsWithProperDates.slice(startIndex, selectedIndex + 1);
  })();

  const summaryText = monthlyData
    ? `${monthlyData.samples_tested?.toLocaleString() || 0} samples · ${monthlyData.pass_rate || 0}% pass rate (${format(selectedDateObj, "MMMM yyyy")})`
    : "No data available";

  return (
    <AnimatedCard index={index}>
      <Card className={`transition-all hover:shadow-md ${active ? "border-primary" : ""}`}>
        <CardContent className="px-5 py-4 space-y-3">
          <div className="flex justify-between cursor-pointer" onClick={() => setExpanded((v) => !v)}>
            <CardHeader color="coral" icon={FlaskConical} label="Quality Control" summary={summaryText} />
            <div className="text-right">
              <p className="text-2xl font-bold">{displayPassRate > 0 ? `${displayPassRate}%` : "0%"}</p>
              <p className="text-xs text-muted-foreground">pass rate</p>
              {!isToday && selectedDayData && (
                <div className="flex justify-end mt-1">
                  <HistoricalBadge label={format(selectedDateObj, "MMM d")} />
                </div>
              )}
              <CardTimestamp timeLabel={timeLabel} dateLabel={dateLabel} />
            </div>
          </div>

          <div className="pt-1 border-t border-border/30">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                {format(selectedDateObj, "MMMM d, yyyy")}
              </p>
              {!hasDailyData && <span className="text-[10px] text-muted-foreground italic">No inspections</span>}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-0.5">
                <p className="text-[10px] text-muted-foreground">Tested</p>
                <p className="text-base font-bold">{displayTested}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Passed</p>
                <p className="text-base font-bold">{displayPassed}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] text-red-600 dark:text-red-400">Failed</p>
                <p className="text-base font-bold">{displayFailed}</p>
              </div>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                key="qc-expanded"
                variants={expandVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="pt-2 border-t border-border/50 space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Monthly Pass Rate ({format(selectedDateObj, "MMMM yyyy")})</span>
                      <span className="font-medium text-foreground">{monthlyData?.pass_rate || 0}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full bg-emerald-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${monthlyData?.pass_rate || 0}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Tested</p>
                      <p className="text-sm font-semibold">{monthlyData?.samples_tested?.toLocaleString() || 0}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Passed</p>
                      <p className="text-sm font-semibold">{monthlyData?.samples_passed?.toLocaleString() || 0}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-red-600 dark:text-red-400 uppercase tracking-wide">Failed</p>
                      <p className="text-sm font-semibold">{monthlyData?.samples_failed?.toLocaleString() || 0}</p>
                    </div>
                  </div>

                  <div className="pt-1 space-y-1.5">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Monthly Rejection Rate</span>
                      <span className="font-medium text-foreground">{monthlyData?.rejection_rate || 0}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full bg-red-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${monthlyData?.rejection_rate || 0}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  {productPerformance.length > 0 && (
                    <div className="pt-1 space-y-2">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                        Products Tested ({monthlyData?.samples_tested || 0} total)
                      </p>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                        {productPerformance.slice(0, 5).map((product: any, idx: number) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] font-medium text-foreground truncate max-w-[140px]">
                                {product.product_name}
                              </span>
                              <span className="text-[10px] font-semibold">
                                {product.passed}/{product.tested}
                                <span className="text-muted-foreground ml-1">({product.pass_rate}%)</span>
                              </span>
                            </div>
                            <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
                              <motion.div
                                className={`h-full rounded-full ${product.pass_rate >= 90 ? "bg-emerald-500" : product.pass_rate >= 70 ? "bg-amber-500" : "bg-red-500"}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${product.pass_rate}%` }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {previousMonthlyData && previousMonthlyData.samples_tested > 0 && (
                    <div className="flex justify-between items-center pt-1 border-t border-border/30">
                      <span className="text-[10px] text-muted-foreground">Previous Month ({previousMonthlyData.month})</span>
                      <div className="text-right">
                        <span className="text-xs font-medium">{previousMonthlyData.pass_rate}% pass rate</span>
                        {momChange !== null && (
                          <span className={`text-[10px] ml-2 ${momChange >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                            {momChange >= 0 ? "+" : ""}{momChange}% vs last month
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {trendData.length > 0 && (
                    <div className="pt-1 space-y-2">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Daily Trend</p>
                      <div className="space-y-1.5">
                        {trendData.map((day: any, idx: number) => {
                          const dayDate = day.date.includes("T") ? day.date.split("T")[0] : day.date;
                          const isSelected = dayDate === selectedDateISO;
                          return (
                            <div key={idx} className="flex justify-between items-center text-[10px]">
                              <span className={`text-muted-foreground ${isSelected ? "font-medium" : ""}`}>
                                {format(new Date(dayDate + "T00:00:00"), "MMM d")}
                                {isSelected && <span className="ml-1 text-[8px] font-medium text-primary">(selected)</span>}
                              </span>
                              <div className="flex-1 mx-2 h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${day.pass_rate}%` }} />
                              </div>
                              <span className={`font-medium ${isSelected ? "text-primary" : ""}`}>{day.pass_rate}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <ExpandRow
            id="qc"
            expanded={expanded}
            onToggle={() => setExpanded((v) => !v)}
            basePath={basePath}
          />
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}