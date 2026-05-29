import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useLocation } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Factory,
  ShoppingCart,
  TrendingUp,
  Wallet,
  ArrowLeftRight,
  FlaskConical,
  Users,
  Wrench,
  Zap,
  Calendar as CalendarIcon,
  ChevronDown,
  ExternalLink,
} from "lucide-react";

import { useDashboardStore } from "@/store/dashboard.store";
import { mockData } from "@/routes/auth/-data/-mock-data";
import { WorkforceStats } from "@/types/dashboard.types";

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────────────────── */

type SegmentColor =
  | "teal"
  | "amber"
  | "green"
  | "purple"
  | "blue"
  | "coral"
  | "pink"
  | "red";

type DashboardSegment =
  | "production"
  | "sales"
  | "procurement"
  | "accounts"
  | "trading"
  | "qc"
  | "workforce"
  | "maintenance"
  | "energy";

type DashboardRoute = `/auth/admin/dashboard/${DashboardSegment}`;

/* ─────────────────────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────────────────────── */

const COLOR_MAP: Record<SegmentColor, { bg: string; icon: string }> = {
  teal: { bg: "bg-teal-500/10", icon: "text-teal-700   dark:text-teal-400" },
  amber: { bg: "bg-amber-500/10", icon: "text-amber-700  dark:text-amber-400" },
  green: { bg: "bg-green-500/10", icon: "text-green-700  dark:text-green-400" },
  purple: {
    bg: "bg-purple-500/10",
    icon: "text-purple-700 dark:text-purple-400",
  },
  blue: { bg: "bg-blue-500/10", icon: "text-blue-700   dark:text-blue-400" },
  coral: {
    bg: "bg-orange-500/10",
    icon: "text-orange-700 dark:text-orange-400",
  },
  pink: { bg: "bg-pink-500/10", icon: "text-pink-700   dark:text-pink-400" },
  red: { bg: "bg-red-500/10", icon: "text-red-700    dark:text-red-400" },
};

const STATUS_STYLES: Record<string, { dot: string; bg: string; text: string }> =
  {
    operational: {
      dot: "bg-emerald-500",
      bg: "bg-emerald-500/10",
      text: "text-emerald-700 dark:text-emerald-400",
    },
    maintenance: {
      dot: "bg-amber-500",
      bg: "bg-amber-500/10",
      text: "text-amber-700  dark:text-amber-400",
    },
    standby: {
      dot: "bg-blue-500",
      bg: "bg-blue-500/10",
      text: "text-blue-700   dark:text-blue-400",
    },
    down: {
      dot: "bg-red-500",
      bg: "bg-red-500/10",
      text: "text-red-700    dark:text-red-400",
    },
  };

const STATUS_ORDER = ["operational", "maintenance", "standby", "down"] as const;

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */

const getTodayISO = () => new Date().toLocaleDateString("en-CA");
const toISO = (d: Date) => new Date(d).toLocaleDateString("en-CA");
const toMonthKey = (s: string) => s.slice(0, 7);
const currentMonthKey = () => toMonthKey(getTodayISO());

const fmt = (n: number) => n.toLocaleString();
const fmtUSD = (n: number) =>
  "$" +
  n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const fmtPHP = (n: number) =>
  "₱" +
  n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
const fmtMonthLabel = (ym: string) => {
  const [y, m] = ym.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-PH", {
    month: "short",
    year: "numeric",
  });
};

function relativeTime(date: Date) {
  const now = new Date();

  // Compare calendar dates only, ignoring time-of-day drift
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thatDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const days = Math.round(
    (todayDate.getTime() - thatDate.getTime()) / 86_400_000,
  );

  if (days === 0) {
    const mins = Math.floor((now.getTime() - date.getTime()) / 60_000);
    const hours = Math.floor(mins / 60);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    return `${hours}h ago`;
  }
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   MOCK DERIVATIONS  (computed once at module level)
───────────────────────────────────────────────────────────────────────────── */

// ── Accounts ──────────────────────────────────────────────────────────────────
const _acctReceivables = mockData.accounts
  .filter((a) => a.type === "receivable")
  .reduce((s, a) => s + a.amount, 0);
const _acctPayables = mockData.accounts
  .filter((a) => a.type === "payable" || a.type === "expense")
  .reduce((s, a) => s + a.amount, 0);
const _acctNet = _acctReceivables - _acctPayables;
const _acctOverdue = mockData.accounts.filter(
  (a) =>
    a.type === "receivable" &&
    a.due !== "Received" &&
    new Date(a.due) < new Date(),
).length;

// ── Procurement ───────────────────────────────────────────────────────────────
const _proc = mockData.procurement;
const _procPending = _proc.filter((p) => p.status === "pending").length;
const _procDelayed = _proc.filter((p) => p.status === "delayed").length;
const _procOpen = _proc.filter((p) => p.status !== "received").length;

// ── Trading ───────────────────────────────────────────────────────────────────
const _trades = mockData.trading.filter((t) => t.volumeIn > 0);
const _tradeTotalVolumeIn = _trades.reduce((s, t) => s + t.volumeIn, 0);
const _tradeActiveCount = _trades.length;

/* ─────────────────────────────────────────────────────────────────────────────
   ANIMATION
───────────────────────────────────────────────────────────────────────────── */

const expandVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: { height: "auto", opacity: 1 },
};

/* ─────────────────────────────────────────────────────────────────────────────
   SMALL COMPONENTS
───────────────────────────────────────────────────────────────────────────── */

function StatusPill({ status, count }: { status: string; count: number }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.standby;
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${s.bg}`}>
      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
      <span className={`text-xs font-medium capitalize ${s.text}`}>
        {status}
      </span>
      <span className={`text-xs font-bold ${s.text}`}>{count}</span>
    </div>
  );
}

function CardTimestamp({
  timeLabel,
  dateLabel,
}: {
  timeLabel: string;
  dateLabel: string;
}) {
  return (
    <div className="flex gap-1 mt-1 justify-end">
      <span className="text-[10px] px-2 py-0.5 rounded bg-muted">
        {timeLabel}
      </span>
      <span className="text-[10px] text-muted-foreground">{dateLabel}</span>
    </div>
  );
}

function HistoricalBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400">
      <CalendarIcon className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}

function SampleBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border/60">
      Sample data · API coming soon
    </span>
  );
}

function MockRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className="text-xs font-semibold">{value}</span>
    </div>
  );
}

function CardHeader({
  color,
  icon: Icon,
  label,
  summary,
}: {
  color: SegmentColor;
  icon: React.ElementType;
  label: string;
  summary: string;
}) {
  const { bg, icon: iconColor } = COLOR_MAP[color];
  return (
    <div className="flex gap-3">
      <div
        className={`shrink-0 h-9 w-9 rounded-lg ${bg} flex items-center justify-center`}
      >
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <div>
        <p className="font-semibold text-lg">{label}</p>
        <p className="text-xs text-muted-foreground">{summary}</p>
      </div>
    </div>
  );
}

function ExpandRow({
  id,
  expanded,
  onToggle,
}: {
  id: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between pt-2 border-t border-border/40 mt-2">
      <button
        onClick={onToggle}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="inline-flex"
        >
          <ChevronDown className="h-3 w-3" />
        </motion.span>
        {expanded ? "Collapse" : "Expand"}
      </button>
      <Link
        to={`/auth/admin/dashboard/${id}` as DashboardRoute}
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <ExternalLink className="h-3 w-3" />
        Open
      </Link>
    </div>
  );
}

function AnimatedCard({
  index,
  children,
}: {
  index: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ y: -2, scale: 1.003 }}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   DASH CARD  (live tiles)
───────────────────────────────────────────────────────────────────────────── */

function DashCard({
  id,
  color,
  label,
  icon,
  summary,
  stat,
  unit,
  timeLabel,
  dateLabel,
  active,
  index,
  expandedContent,
}: {
  id: string;
  color: SegmentColor;
  label: string;
  icon: React.ElementType;
  summary: string;
  stat: string;
  unit: string;
  timeLabel: string;
  dateLabel: string;
  active: boolean;
  index: number;
  expandedContent?: React.ReactNode;
}) {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <AnimatedCard index={index}>
      <Card
        className={`transition-all hover:shadow-md ${active ? "border-primary" : ""}`}
      >
        <CardContent className="px-5 py-4">
          <div
            className="flex justify-between cursor-pointer"
            onClick={() => setExpanded((v) => !v)}
          >
            <CardHeader
              color={color}
              icon={icon}
              label={label}
              summary={summary}
            />
            <div className="text-right">
              <p className="text-2xl font-bold">{stat}</p>
              <p className="text-xs text-muted-foreground">{unit}</p>
              <CardTimestamp timeLabel={timeLabel} dateLabel={dateLabel} />
            </div>
          </div>
          <AnimatePresence initial={false}>
            {expanded && expandedContent && (
              <motion.div
                key="expanded"
                variants={expandVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="pt-3 mt-2 border-t border-border/50">
                  {expandedContent}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <ExpandRow
            id={id}
            expanded={expanded}
            onToggle={() => setExpanded((v) => !v)}
          />
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   QC CARD (FIXED - Now properly shows daily data like Workforce card)
───────────────────────────────────────────────────────────────────────────── */

function QcCard({
  active,
  index,
  qcStats,
  timeLabel,
  dateLabel,
  selectedDateISO,
}: {
  active: boolean;
  index: number;
  qcStats: any;
  timeLabel: string;
  dateLabel: string;
  selectedDateISO: string;
}) {
  const [expanded, setExpanded] = React.useState(false);

  if (!qcStats || !qcStats.current_month) {
    return (
      <AnimatedCard index={index}>
        <Card
          className={`transition-all hover:shadow-md ${active ? "border-primary" : ""}`}
        >
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

  // Find the daily data for the selected date from daily_trend
  const selectedDayData = qcStats.daily_trend?.find((day: any) => {
    const dayDate = day.date.includes("T") ? day.date.split("T")[0] : day.date;
    return dayDate === selectedDateISO;
  });

  // Get today's date for comparison
  const isToday = selectedDateISO === getTodayISO();
  const selectedDateObj = new Date(selectedDateISO + "T00:00:00");

  // DAILY DATA is the primary source - this is what shows in the main stat
  const hasDailyData = selectedDayData && selectedDayData.tested > 0;
  const displayPassRate = hasDailyData ? selectedDayData.pass_rate : 0;
  const displayTested = hasDailyData ? selectedDayData.tested : 0;
  const displayPassed = hasDailyData ? selectedDayData.passed : 0;
  const displayFailed = hasDailyData ? selectedDayData.failed : 0;

  // Monthly data for the selected date's month (for expanded view)
  const selectedMonthKey = toMonthKey(selectedDateISO);
  const monthlyData =
    qcStats.monthly_breakdown?.find((m: any) => m.month === selectedMonthKey) ||
    qcStats.current_month;

  // Get previous month data for comparison
  const previousMonthDate = new Date(selectedDateObj);
  previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
  const previousMonthKey = toMonthKey(
    previousMonthDate.toLocaleDateString("en-CA"),
  );
  const previousMonthlyData = qcStats.monthly_breakdown?.find(
    (m: any) => m.month === previousMonthKey,
  );

  // Calculate month-over-month change
  const momChange =
    previousMonthlyData && monthlyData
      ? monthlyData.pass_rate - previousMonthlyData.pass_rate
      : null;

  // Get product performance for the month
  const productPerformance = qcStats.product_performance || [];

  // Get trend data for last 7 days relative to selected date
  const getTrendDataForSelectedDate = () => {
    if (!qcStats.daily_trend || qcStats.daily_trend.length === 0) return [];

    // Convert all dates to ISO format (YYYY-MM-DD)
    const trendsWithProperDates = qcStats.daily_trend.map((day: any) => ({
      ...day,
      date: day.date.includes("T") ? day.date.split("T")[0] : day.date,
    }));

    const selectedIndex = trendsWithProperDates.findIndex(
      (day: any) => day.date === selectedDateISO,
    );

    if (selectedIndex === -1) {
      // If selected date not found, show last 7 days
      return trendsWithProperDates.slice(-7);
    }

    // Show up to 7 days ending at selected date
    const startIndex = Math.max(0, selectedIndex - 6);
    return trendsWithProperDates.slice(startIndex, selectedIndex + 1);
  };

  const trendData = getTrendDataForSelectedDate();

  // Summary text for header - shows monthly context
  const summaryText = monthlyData
    ? `${monthlyData.samples_tested?.toLocaleString() || 0} samples · ${monthlyData.pass_rate || 0}% pass rate (${format(selectedDateObj, "MMMM yyyy")})`
    : "No data available";

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
              color="coral"
              icon={FlaskConical}
              label="Quality Control"
              summary={summaryText}
            />
            <div className="text-right">
              <p className="text-2xl font-bold">
                {displayPassRate > 0 ? `${displayPassRate}%` : "0%"}
              </p>
              <p className="text-xs text-muted-foreground">pass rate</p>
              {!isToday && selectedDayData && (
                <div className="flex justify-end mt-1">
                  <HistoricalBadge label={format(selectedDateObj, "MMM d")} />
                </div>
              )}
              <CardTimestamp timeLabel={timeLabel} dateLabel={dateLabel} />
            </div>
          </div>

          {/* Daily Summary Section - Shows selected date's data prominently */}
          <div className="pt-1 border-t border-border/30">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                {format(selectedDateObj, "MMMM d, yyyy")}
              </p>
              {!hasDailyData && (
                <span className="text-[10px] text-muted-foreground italic">
                  No inspections
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-0.5">
                <p className="text-[10px] text-muted-foreground">Tested</p>
                <p className="text-base font-bold">{displayTested}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                  Passed
                </p>
                <p className="text-base font-bold">{displayPassed}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] text-red-600 dark:text-red-400">
                  Failed
                </p>
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
                  {/* Monthly Pass Rate Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>
                        Monthly Pass Rate (
                        {format(selectedDateObj, "MMMM yyyy")})
                      </span>
                      <span className="font-medium text-foreground">
                        {monthlyData?.pass_rate || 0}%
                      </span>
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

                  {/* Monthly Key Metrics Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        Tested
                      </p>
                      <p className="text-sm font-semibold">
                        {monthlyData?.samples_tested?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                        Passed
                      </p>
                      <p className="text-sm font-semibold">
                        {monthlyData?.samples_passed?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-red-600 dark:text-red-400 uppercase tracking-wide">
                        Failed
                      </p>
                      <p className="text-sm font-semibold">
                        {monthlyData?.samples_failed?.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>

                  {/* Monthly Rejection Rate */}
                  <div className="pt-1 space-y-1.5">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Monthly Rejection Rate</span>
                      <span className="font-medium text-foreground">
                        {monthlyData?.rejection_rate || 0}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full bg-red-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${monthlyData?.rejection_rate || 0}%`,
                        }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  {/* Products Tested */}
                  {productPerformance.length > 0 && (
                    <div className="pt-1 space-y-2">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                        Products Tested ({monthlyData?.samples_tested || 0}{" "}
                        total)
                      </p>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                        {productPerformance
                          .slice(0, 5)
                          .map((product: any, idx: number) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-[11px] font-medium text-foreground truncate max-w-[140px]">
                                  {product.product_name}
                                </span>
                                <span className="text-[10px] font-semibold">
                                  {product.passed}/{product.tested}
                                  <span className="text-muted-foreground ml-1">
                                    ({product.pass_rate}%)
                                  </span>
                                </span>
                              </div>
                              <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
                                <motion.div
                                  className={`h-full rounded-full ${
                                    product.pass_rate >= 90
                                      ? "bg-emerald-500"
                                      : product.pass_rate >= 70
                                        ? "bg-amber-500"
                                        : "bg-red-500"
                                  }`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${product.pass_rate}%` }}
                                  transition={{
                                    duration: 0.3,
                                    ease: "easeOut",
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Monthly Low Pass Rate Warning */}
                  {monthlyData?.pass_rate < 85 &&
                    monthlyData?.pass_rate > 0 && (
                      <div className="pt-2 mt-1 p-2 rounded-md bg-amber-500/10 border border-amber-500/20">
                        <div className="flex items-center gap-2">
                          <span className="text-amber-600 dark:text-amber-400 text-[10px] font-medium">
                            ⚠️ Quality Alert
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Monthly pass rate below 85% ({monthlyData.pass_rate}
                          %). Review quality control processes for{" "}
                          {format(selectedDateObj, "MMMM yyyy")}.
                        </p>
                      </div>
                    )}

                  {/* Month-over-Month Comparison */}
                  {previousMonthlyData &&
                    previousMonthlyData.samples_tested > 0 && (
                      <div className="flex justify-between items-center pt-1 border-t border-border/30">
                        <span className="text-[10px] text-muted-foreground">
                          Previous Month ({previousMonthlyData.month})
                        </span>
                        <div className="text-right">
                          <span className="text-xs font-medium">
                            {previousMonthlyData.pass_rate}% pass rate
                          </span>
                          {momChange !== null && (
                            <span
                              className={`text-[10px] ml-2 ${
                                momChange >= 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              {momChange >= 0 ? "+" : ""}
                              {momChange}% vs last month
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                  {/* Daily Trend (last 7 days around selected date) */}
                  {trendData.length > 0 && (
                    <div className="pt-1 space-y-2">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                        Daily Trend
                      </p>
                      <div className="space-y-1.5">
                        {trendData.map((day: any, idx: number) => {
                          const dayDate = day.date.includes("T")
                            ? day.date.split("T")[0]
                            : day.date;
                          const isSelected = dayDate === selectedDateISO;
                          return (
                            <div
                              key={idx}
                              className="flex justify-between items-center text-[10px]"
                            >
                              <span
                                className={`text-muted-foreground ${isSelected ? "font-medium" : ""}`}
                              >
                                {format(
                                  new Date(dayDate + "T00:00:00"),
                                  "MMM d",
                                )}
                                {isSelected && (
                                  <span className="ml-1 text-[8px] font-medium text-primary">
                                    (selected)
                                  </span>
                                )}
                              </span>
                              <div className="flex-1 mx-2 h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${day.pass_rate}%` }}
                                />
                              </div>
                              <span
                                className={`font-medium ${isSelected ? "text-primary" : ""}`}
                              >
                                {day.pass_rate}%
                              </span>
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
          />
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   STUB CARD  (mock data, dashed border, SampleBadge)
───────────────────────────────────────────────────────────────────────────── */

function StubCard({
  id,
  color,
  label,
  icon,
  summary,
  stat,
  unit,
  index,
  expandedContent,
  active,
}: {
  id: string;
  color: SegmentColor;
  label: string;
  icon: React.ElementType;
  summary: string;
  stat: string;
  unit: string;
  index: number;
  expandedContent: React.ReactNode;
  active: boolean;
}) {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <AnimatedCard index={index}>
      <Card
        className={`transition-all hover:shadow-md border-dashed ${active ? "border-primary" : ""}`}
      >
        <CardContent className="px-5 py-4">
          <div
            className="flex justify-between cursor-pointer"
            onClick={() => setExpanded((v) => !v)}
          >
            <CardHeader
              color={color}
              icon={icon}
              label={label}
              summary={summary}
            />
            <div className="text-right">
              <p className="text-2xl font-bold text-muted-foreground">{stat}</p>
              <p className="text-xs text-muted-foreground">{unit}</p>
              <CardTimestamp timeLabel="Sample" dateLabel="mock" />
            </div>
          </div>
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                key="stub-expanded"
                variants={expandVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="pt-3 mt-2 border-t border-border/50 space-y-3">
                  <SampleBadge />
                  {expandedContent}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <ExpandRow
            id={id}
            expanded={expanded}
            onToggle={() => setExpanded((v) => !v)}
          />
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   STUB EXPANDED CONTENT
───────────────────────────────────────────────────────────────────────────── */

const AccountsExpanded = () => (
  <div className="space-y-2">
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
          Receivables
        </p>
        <p className="text-sm font-semibold">{fmtPHP(_acctReceivables)}</p>
      </div>
      <div className="space-y-1">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
          Payables + Exp.
        </p>
        <p className="text-sm font-semibold">{fmtPHP(_acctPayables)}</p>
      </div>
    </div>
    <div className="pt-1 border-t border-border/30 space-y-1.5">
      {mockData.accounts.slice(0, 3).map((a) => (
        <MockRow
          key={a.description}
          label={
            a.description.length > 32
              ? a.description.slice(0, 32) + "…"
              : a.description
          }
          value={`${a.type === "payable" || a.type === "expense" ? "−" : "+"}${fmtPHP(a.amount)}`}
        />
      ))}
      <MockRow label="Overdue accounts" value={`${_acctOverdue} invoices`} />
    </div>
  </div>
);

const ProcurementExpanded = () => (
  <div className="space-y-2">
    <div className="grid grid-cols-3 gap-2">
      <div className="space-y-1">
        <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
          Received
        </p>
        <p className="text-sm font-semibold">
          {_proc.filter((p) => p.status === "received").length}
        </p>
      </div>
      <div className="space-y-1">
        <p className="text-[10px] text-amber-600 dark:text-amber-400">
          Pending
        </p>
        <p className="text-sm font-semibold">{_procPending}</p>
      </div>
      <div className="space-y-1">
        <p className="text-[10px] text-red-600 dark:text-red-400">Delayed</p>
        <p className="text-sm font-semibold">{_procDelayed}</p>
      </div>
    </div>
    <div className="pt-1 border-t border-border/30 space-y-1.5">
      {mockData.procurement.map((p) => (
        <div key={p.name} className="flex justify-between items-center">
          <span className="text-[10px] text-muted-foreground truncate max-w-[160px]">
            {p.name}
          </span>
          <span
            className={`text-[10px] font-semibold capitalize ${
              p.status === "received"
                ? "text-emerald-600 dark:text-emerald-400"
                : p.status === "delayed"
                  ? "text-red-600 dark:text-red-400"
                  : "text-amber-600 dark:text-amber-400"
            }`}
          >
            {p.status}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const TradingExpanded = () => (
  <div className="space-y-2">
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
          Operations
        </p>
        <p className="text-sm font-semibold">{_tradeActiveCount}</p>
      </div>
      <div className="space-y-1">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
          Total Input
        </p>
        <p className="text-sm font-semibold">{fmt(_tradeTotalVolumeIn)} kg</p>
      </div>
    </div>
    <div className="pt-1 border-t border-border/30 space-y-1.5">
      {mockData.trading
        .filter((t) => t.volumeIn > 0)
        .map((t) => (
          <div key={t.name} className="flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground truncate max-w-[160px]">
              {t.name}
            </span>
            <span className="text-[10px] font-semibold">
              {fmt(t.volumeIn)} → {fmt(t.volumeOut)} {t.unit}
            </span>
          </div>
        ))}
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   ENERGY CARD
───────────────────────────────────────────────────────────────────────────── */

function EnergyCard({
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
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                      {displayLabel}
                    </span>
                    {isCurrentMonth && (
                      <span
                        className={`text-[10px] font-medium ${momChangePct == null ? "text-muted-foreground" : momChangePct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                      >
                        {momLabel}
                      </span>
                    )}
                  </div>
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
          />
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAINTENANCE CARD
───────────────────────────────────────────────────────────────────────────── */

function MaintenanceCard({
  active,
  index,
  checkedToday,
  totalUnits,
  completion,
  statusBreakdown,
  timeLabel,
  dateLabel,
}: {
  active: boolean;
  index: number;
  checkedToday: number;
  totalUnits: number;
  completion: number;
  statusBreakdown: Record<string, number> | undefined;
  timeLabel: string;
  dateLabel: string;
}) {
  const [expanded, setExpanded] = React.useState(false);
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
              color="red"
              icon={Wrench}
              label="Maintenance"
              summary={`${completion}% completion today`}
            />
            <div className="text-right pb-5">
              <p className="text-2xl font-bold">
                {checkedToday}/{totalUnits}
              </p>
              <p className="text-xs text-muted-foreground">
                units checked today
              </p>
              <CardTimestamp timeLabel={timeLabel} dateLabel={dateLabel} />
            </div>
          </div>
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                key="maintenance-expanded"
                variants={expandVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="pt-3 border-t border-border/50 space-y-2">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                    Unit status
                  </p>
                  <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full bg-emerald-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${completion}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                  <div className="pt-1 grid grid-cols-2 gap-2">
                    {STATUS_ORDER.map((s) => (
                      <StatusPill
                        key={s}
                        status={s}
                        count={statusBreakdown?.[s] ?? 0}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <ExpandRow
            id="maintenance"
            expanded={expanded}
            onToggle={() => setExpanded((v) => !v)}
          />
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SALES CARD
───────────────────────────────────────────────────────────────────────────── */

function SalesCard({
  active,
  index,
  thisMonth,
  lastMonth,
  momChangePct,
  monthlyBreakdown,
  timeLabel,
  dateLabel,
  selectedMonthKey,
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
                summary={`${displayEntries ?? "—"} entries · ${displayMonthLabel}`}
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
                      className={`text-[10px] font-medium ${momChangePct == null ? "text-muted-foreground" : momChangePct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
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
                        {displayEntries ?? "—"}
                      </p>
                    </div>
                  </div>
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
                  {isHistorical && !histEntry && (
                    <p className="text-[10px] text-muted-foreground italic">
                      No sales data for {displayMonthLabel}.
                    </p>
                  )}
                  {isCurrentMonth && (
                    <div className="flex justify-between items-center pt-1 border-t border-border/30">
                      <span className="text-[10px] text-muted-foreground">
                        Last Month (
                        {fmtMonthLabel(
                          (() => {
                            const d = new Date();
                            d.setDate(1);
                            d.setMonth(d.getMonth() - 1);
                            return toMonthKey(d.toLocaleDateString("en-CA"));
                          })(),
                        )}
                        )
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
          />
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   WORKFORCE CARD
───────────────────────────────────────────────────────────────────────────── */

function WorkforceCard({
  active,
  index,
  workforce,
  timeLabel,
  dateLabel,
}: {
  active: boolean;
  index: number;
  workforce: WorkforceStats | undefined;
  timeLabel: string;
  dateLabel: string;
}) {
  const [expanded, setExpanded] = React.useState(false);

  if (!workforce) {
    return (
      <AnimatedCard index={index}>
        <Card
          className={`transition-all hover:shadow-md ${active ? "border-primary" : ""}`}
        >
          <CardContent className="px-5 py-4">
            <div className="flex justify-between">
              <CardHeader
                color="pink"
                icon={Users}
                label="Workforce"
                summary="Loading workforce data..."
              />
              <div className="text-right">
                <p className="text-2xl font-bold text-muted-foreground">—</p>
                <p className="text-xs text-muted-foreground">present today</p>
                <CardTimestamp timeLabel="—" dateLabel="—" />
              </div>
            </div>
          </CardContent>
        </Card>
      </AnimatedCard>
    );
  }

  const absentCount = workforce.total_headcount - workforce.total_present;
  const attendanceRate = workforce.attendance_rate ?? 0;

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
              color="pink"
              icon={Users}
              label="Workforce"
              summary={`${attendanceRate}% attendance · ${workforce.total_incidents} incidents`}
            />
            <div className="text-right">
              <p className="text-2xl font-bold">
                {workforce.total_present}/{workforce.total_headcount}
              </p>
              <p className="text-xs text-muted-foreground">present today</p>
              <CardTimestamp timeLabel={timeLabel} dateLabel={dateLabel} />
            </div>
          </div>

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                key="workforce-expanded"
                variants={expandVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="pt-3 border-t border-border/50 space-y-3">
                  {/* Attendance Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Attendance Rate</span>
                      <span className="font-medium text-foreground">
                        {attendanceRate}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full bg-emerald-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${attendanceRate}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wide font-medium">
                        Present
                      </p>
                      <p className="text-lg font-bold">
                        {workforce.total_present}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-red-600 dark:text-red-400 uppercase tracking-wide font-medium">
                        Absent
                      </p>
                      <p className="text-lg font-bold">{absentCount}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 uppercase tracking-wide font-medium">
                        Incidents
                      </p>
                      <p className="text-lg font-bold">
                        {workforce.total_incidents}
                      </p>
                    </div>
                  </div>

                  {/* OPEX Breakdown */}
                  <div className="pt-1 space-y-2">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                      OPEX ({workforce.department_count})
                    </p>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      {workforce.departments.map((dept) => {
                        const deptRate = dept.rate ?? 0;
                        return (
                          <div key={dept.key} className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] font-medium text-foreground truncate max-w-[140px]">
                                {dept.label}
                              </span>
                              <span className="text-[10px] font-semibold">
                                {dept.present}/{dept.headcount}
                                <span className="text-muted-foreground ml-1">
                                  ({deptRate}%)
                                </span>
                              </span>
                            </div>
                            <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
                              <motion.div
                                className={`h-full rounded-full ${
                                  deptRate >= 80
                                    ? "bg-emerald-500"
                                    : deptRate >= 60
                                      ? "bg-amber-500"
                                      : "bg-red-500"
                                }`}
                                initial={{ width: 0 }}
                                animate={{ width: `${deptRate}%` }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Lowest Department Warning */}
                  {workforce.lowest_dept &&
                    workforce.lowest_dept.rate !== null &&
                    workforce.lowest_dept.rate < 70 && (
                      <div className="pt-2 mt-1 p-2 rounded-md bg-amber-500/10 border border-amber-500/20">
                        <div className="flex items-center gap-2">
                          <span className="text-amber-600 dark:text-amber-400 text-[10px] font-medium">
                            ⚠️ Attention Needed
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {workforce.lowest_dept.label} has the lowest
                          attendance at {workforce.lowest_dept.rate}%
                        </p>
                      </div>
                    )}

                  {/* Section Summary */}
                  {Object.keys(workforce.by_section).length > 0 && (
                    <div className="pt-1 border-t border-border/30">
                      <p className="text-[10px] text-muted-foreground mb-1">
                        By Section
                      </p>
                      {Object.entries(workforce.by_section).map(
                        ([section, data]) => {
                          // Function to transform section name
                          const getDisplayName = (sectionName: string) => {
                            if (
                              sectionName.toLowerCase().includes("department")
                            ) {
                              return "OPEX";
                            }
                            // Add other transformations here if needed
                            return sectionName;
                          };

                          return (
                            <div
                              key={section}
                              className="flex justify-between text-[10px]"
                            >
                              <span className="text-muted-foreground">
                                {getDisplayName(section)}
                              </span>
                              <span>
                                {data.present}/{data.headcount} (
                                {data.rate ?? 0}%)
                              </span>
                            </div>
                          );
                        },
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <ExpandRow
            id="workforce"
            expanded={expanded}
            onToggle={() => setExpanded((v) => !v)}
          />
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */

export default function CEODashboard() {
  const location = useLocation();
  const isActive = (id: string) =>
    location.pathname === `/auth/admin/dashboard/${id}`;

  const [time, setTime] = React.useState(() => new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date>(
    () => new Date(),
  );

  const selectedISO = toISO(selectedDate);
  const selectedMthKey = toMonthKey(selectedISO);
  const isToday = selectedISO === getTodayISO();

  const { stats, loading: loadingStats, fetchStats } = useDashboardStore();
  const production = stats?.production;
  const maintenance = stats?.maintenance;
  const sales = stats?.sales;
  const energy = stats?.energy;
  const workforce = stats?.workforce;
  const qc = stats?.qc;

  React.useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  function handleDateSelect(d: Date | undefined) {
    if (!d) return;
    setSelectedDate(d);
    fetchStats(toISO(d));
  }

  const productionStat = loadingStats
    ? "—"
    : production?.today_production_output
      ? fmt(production.today_production_output)
      : production?.yesterday_production_output && isToday
        ? `${fmt(production.yesterday_production_output)} (yesterday)`
        : "No data";

  const productionUnit = isToday
    ? "units today"
    : `units on ${format(new Date(selectedISO + "T00:00:00"), "MMM d")}`;

  const productionExpanded = (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Today
          </p>
          <p className="text-sm font-semibold">
            {production?.today_production_output
              ? fmt(production.today_production_output)
              : "—"}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Yesterday
          </p>
          <p className="text-sm font-semibold">
            {production?.yesterday_production_output
              ? fmt(production.yesterday_production_output)
              : "—"}
          </p>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground">
        6 product lines running
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto py-0 space-y-5">
        {/* ── HEADER ── */}
        <div className="flex items-center justify-end gap-3">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-muted-foreground flex items-center gap-2">
            Live dashboard —
            <span className="font-medium text-foreground">
              {time.toLocaleTimeString("en-PH", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
            <span className="text-muted-foreground">
              {format(selectedDate, "PPP")}
            </span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(d) => d > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </span>
        </div>

        {/* ── TWO-COLUMN LAYOUT ── */}
        <div className="flex flex-col md:flex-row gap-3 items-start">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-3 flex-1 min-w-0">
            <DashCard
              id="production"
              color="teal"
              icon={Factory}
              label="Production Output"
              summary="6 product lines running"
              stat={productionStat}
              unit={productionUnit}
              timeLabel={
                production?.last_updated_at
                  ? relativeTime(new Date(production.last_updated_at))
                  : "—"
              }
              dateLabel={
                production?.last_updated_at
                  ? fmtDate(new Date(production.last_updated_at))
                  : "—"
              }
              active={isActive("production")}
              index={0}
              expandedContent={productionExpanded}
            />

            <SalesCard
              active={isActive("sales")}
              index={2}
              thisMonth={
                sales?.this_month ?? {
                  total_usd: 0,
                  total_kg: 0,
                  entry_count: 0,
                  export_count: 0,
                  local_count: 0,
                }
              }
              lastMonth={
                sales?.last_month ?? {
                  total_usd: 0,
                  total_kg: 0,
                  entry_count: 0,
                }
              }
              momChangePct={sales?.mom_change_pct ?? null}
              monthlyBreakdown={sales?.monthly_breakdown ?? []}
              timeLabel={
                sales?.last_updated_at
                  ? relativeTime(new Date(sales.last_updated_at))
                  : "—"
              }
              dateLabel={
                sales?.last_updated_at
                  ? fmtDate(new Date(sales.last_updated_at))
                  : "not available"
              }
              selectedMonthKey={selectedMthKey}
            />

            <StubCard
              id="accounts"
              color="purple"
              label="Accounts"
              icon={Wallet}
              summary={`Net position · ${fmtPHP(_acctNet)}`}
              stat={fmtPHP(_acctNet)}
              unit="net cash position"
              active={isActive("accounts")}
              index={4}
              expandedContent={<AccountsExpanded />}
            />

            {/* QC Card - Now with proper daily date filtering */}
            <QcCard
              active={isActive("qc")}
              index={5}
              qcStats={qc}
              timeLabel={
                qc?.last_updated_at
                  ? relativeTime(new Date(qc.last_updated_at))
                  : "—"
              }
              dateLabel={
                qc?.last_updated_at
                  ? fmtDate(new Date(qc.last_updated_at))
                  : "not available"
              }
              selectedDateISO={selectedISO}
            />
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-3 flex-1 min-w-0">
            <MaintenanceCard
              active={isActive("maintenance")}
              index={1}
              checkedToday={maintenance?.checked_today ?? 0}
              totalUnits={maintenance?.total_units ?? 0}
              completion={maintenance?.completion ?? 0}
              statusBreakdown={maintenance?.status_breakdown}
              timeLabel={
                maintenance?.last_updated_at
                  ? relativeTime(new Date(maintenance.last_updated_at))
                  : "—"
              }
              dateLabel={
                maintenance?.last_updated_at
                  ? fmtDate(new Date(maintenance.last_updated_at))
                  : "not available"
              }
            />

            <EnergyCard
              active={isActive("energy")}
              index={1}
              currentMonth={
                energy?.current_month ?? {
                  month: currentMonthKey(),
                  total_billed: 0,
                  total_kw: 0,
                  account2_billed: 0,
                  account3_billed: 0,
                  has_data: false,
                }
              }
              previousMonth={
                energy?.previous_month ?? {
                  month: "",
                  total_billed: 0,
                  has_data: false,
                }
              }
              momChangePct={energy?.mom_change_pct ?? null}
              ytdTotal={energy?.ytd_summary?.total_billed_amount ?? 0}
              timeLabel={
                energy?.last_updated_at
                  ? relativeTime(new Date(energy.last_updated_at))
                  : "—"
              }
              dateLabel={
                energy?.last_updated_at
                  ? fmtDate(new Date(energy.last_updated_at))
                  : "not available"
              }
              selectedMonthKey={selectedMthKey}
              monthlyTrends={energy?.monthly_trends ?? []}
            />

            <StubCard
              id="procurement"
              color="amber"
              label="Procurement"
              icon={ShoppingCart}
              summary={`${_procOpen} open POs · ${_procDelayed} delayed`}
              stat={String(_procOpen)}
              unit="open purchase orders"
              active={isActive("procurement")}
              index={7}
              expandedContent={<ProcurementExpanded />}
            />

            <StubCard
              id="trading"
              color="blue"
              label="Trading"
              icon={ArrowLeftRight}
              summary={`${_tradeActiveCount} operations · ${fmt(_tradeTotalVolumeIn)} kg input`}
              stat={String(_tradeActiveCount)}
              unit="active trade operations"
              active={isActive("trading")}
              index={8}
              expandedContent={<TradingExpanded />}
            />

            <WorkforceCard
              active={isActive("workforce")}
              index={9}
              workforce={workforce}
              timeLabel={
                workforce?.last_updated_at
                  ? relativeTime(new Date(workforce.last_updated_at))
                  : "—"
              }
              dateLabel={
                workforce?.last_updated_at
                  ? fmtDate(new Date(workforce.last_updated_at))
                  : "not available"
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
