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

function relativeTime(date: Date) {
  const ms = Date.now() - date.getTime();
  const mins = Math.floor(ms / 60_000);
  const hours = Math.floor(ms / 3_600_000);
  const days = Math.floor(ms / 86_400_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   EXPAND ANIMATION
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

/* ─────────────────────────────────────────────────────────────────────────────
   EXPAND TOGGLE — shared row used in each card's collapsed header
───────────────────────────────────────────────────────────────────────────── */

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

/* ─────────────────────────────────────────────────────────────────────────────
   ANIMATED WRAPPER
───────────────────────────────────────────────────────────────────────────── */

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
   PLAIN DASH CARD  (production, stubs)
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

          {/* Expand section */}
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
  previousMonth: {
    month: string;
    total_billed: number;
    has_data: boolean;
  };
  momChangePct: number | null;
  ytdTotal: number;
  timeLabel: string;
  dateLabel: string;
}) {
  const [expanded, setExpanded] = React.useState(false);

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
          {/* Collapsed header — always visible */}
          <div
            className="flex justify-between cursor-pointer"
            onClick={() => setExpanded((v) => !v)}
          >
            <CardHeader
              color="amber"
              icon={Zap}
              label="Energy"
              summary={`${currentMonth.has_data ? currentMonth.month : "No data"} · YTD ${fmtPHP(ytdTotal)}`}
            />
            <div className="text-right">
              <p className="text-2xl font-bold">
                {currentMonth.has_data
                  ? fmtPHP(currentMonth.total_billed)
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                total billed this month
              </p>
              <div className="flex items-center gap-2 justify-end">
                <CardTimestamp timeLabel={timeLabel} dateLabel={dateLabel} />
              </div>
            </div>
          </div>

          {/* Expanded detail */}
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
                      Current Month ({currentMonth.month})
                    </span>
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
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground">
                        Account 2
                      </p>
                      <p className="text-sm font-semibold">
                        {currentMonth.has_data
                          ? fmtPHP(currentMonth.account2_billed)
                          : "—"}
                      </p>
                      {currentMonth.has_data && (
                        <p className="text-[10px] text-muted-foreground">
                          {fmt(currentMonth.total_kw)} kWh
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground">
                        Account 3
                      </p>
                      <p className="text-sm font-semibold">
                        {currentMonth.has_data
                          ? fmtPHP(currentMonth.account3_billed)
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {previousMonth.has_data && (
                    <div className="flex justify-between items-center pt-1 border-t border-border/30">
                      <span className="text-[10px] text-muted-foreground">
                        Previous Month ({previousMonth.month})
                      </span>
                      <span className="text-xs font-medium">
                        {fmtPHP(previousMonth.total_billed)}
                      </span>
                    </div>
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
          {/* Collapsed header */}
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

          {/* Expanded detail */}
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
                  {/* Completion bar */}
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
  totalUsd,
  totalKg,
  entryCount,
  exportCount,
  localCount,
  momChangePct,
  timeLabel,
  dateLabel,
}: {
  active: boolean;
  index: number;
  totalUsd: number;
  totalKg: number;
  entryCount: number;
  exportCount: number;
  localCount: number;
  momChangePct: number | null;
  timeLabel: string;
  dateLabel: string;
}) {
  const [expanded, setExpanded] = React.useState(false);

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
          {/* Collapsed header */}
          <div
            className="flex justify-between cursor-pointer"
            onClick={() => setExpanded((v) => !v)}
          >
            <div className="flex grid grid-col-1">
              <CardHeader
                color="green"
                icon={TrendingUp}
                label="Sales"
                summary={`${entryCount} entries this month`}
              />
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-500/10">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  <span className="text-[10px] font-medium text-green-700 dark:text-green-400">
                    Export
                  </span>
                  <span className="text-[10px] font-bold text-green-700 dark:text-green-400">
                    {exportCount}
                  </span>
                </div>
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  <span className="text-[10px] font-medium text-blue-700 dark:text-blue-400">
                    Local
                  </span>
                  <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400">
                    {localCount}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-medium ${momChangePct == null ? "text-muted-foreground" : momChangePct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                >
                  {momLabel}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    · {fmt(totalKg)} kg
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{fmtUSD(totalUsd)}</p>
              <p className="text-xs text-muted-foreground">
                total sales this month
              </p>
              <div className="flex items-center gap-2 justify-end">
                <CardTimestamp timeLabel={timeLabel} dateLabel={dateLabel} />
              </div>
            </div>
          </div>

          {/* Expanded detail */}
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
                        {fmtUSD(totalUsd)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        Volume
                      </p>
                      <p className="text-sm font-semibold">{fmt(totalKg)} kg</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        Entries
                      </p>
                      <p className="text-sm font-semibold">{entryCount}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/30">
                    <div className="space-y-1">
                      <p className="text-[10px] text-green-600 dark:text-green-400 uppercase tracking-wide font-medium">
                        Export
                      </p>
                      <p className="text-sm font-semibold">
                        {exportCount} entries
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-wide font-medium">
                        Local
                      </p>
                      <p className="text-sm font-semibold">
                        {localCount} entries
                      </p>
                    </div>
                  </div>
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
   STUB CARD CONFIG
───────────────────────────────────────────────────────────────────────────── */

const LEFT_STUBS = [
  {
    id: "accounts",
    color: "purple" as SegmentColor,
    label: "Accounts",
    icon: Wallet,
    summary: "Net position",
    stat: "—",
    unit: "—",
  },
  {
    id: "qc",
    color: "coral" as SegmentColor,
    label: "Quality Control",
    icon: FlaskConical,
    summary: "QC status",
    stat: "—",
    unit: "—",
  },
] as const;

const RIGHT_STUBS = [
  {
    id: "procurement",
    color: "amber" as SegmentColor,
    label: "Procurement",
    icon: ShoppingCart,
    summary: "Supply chain status",
    stat: "—",
    unit: "—",
  },
  {
    id: "trading",
    color: "blue" as SegmentColor,
    label: "Trading",
    icon: ArrowLeftRight,
    summary: "Active trades",
    stat: "—",
    unit: "—",
  },
  {
    id: "workforce",
    color: "pink" as SegmentColor,
    label: "Workforce",
    icon: Users,
    summary: "Attendance tracking",
    stat: "—",
    unit: "—",
  },
] as const;

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
  const isToday = selectedISO === getTodayISO();

  const { stats, loading: loadingStats, fetchStats } = useDashboardStore();
  const production = stats?.production;
  const maintenance = stats?.maintenance;
  const sales = stats?.sales;
  const energy = stats?.energy;

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

  // ── Derived values ──────────────────────────────────────────────────────────

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

  // Production expanded content
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

  // ── Render ──────────────────────────────────────────────────────────────────

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
              dateLabel={fmtDate(new Date(selectedISO + "T00:00:00"))}
              active={isActive("production")}
              index={0}
              expandedContent={productionExpanded}
            />

            <SalesCard
              active={isActive("sales")}
              index={2}
              totalUsd={sales?.this_month.total_usd ?? 0}
              totalKg={sales?.this_month.total_kg ?? 0}
              entryCount={sales?.this_month.entry_count ?? 0}
              exportCount={sales?.this_month.export_count ?? 0}
              localCount={sales?.this_month.local_count ?? 0}
              momChangePct={sales?.mom_change_pct ?? null}
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
            />

            {LEFT_STUBS.map((g, i) => (
              <DashCard
                key={g.id}
                id={g.id}
                color={g.color}
                icon={g.icon}
                label={g.label}
                summary={g.summary}
                stat={g.stat}
                unit={g.unit}
                timeLabel="—"
                dateLabel="not available"
                active={isActive(g.id)}
                index={i + 4}
              />
            ))}
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
                  month: format(new Date(), "yyyy-MM"),
                  total_billed: 0,
                  total_kw: 0,
                  account2_billed: 0,
                  account3_billed: 0,
                  has_data: false,
                }
              }
              previousMonth={
                energy?.previous_month ?? {
                  month: format(new Date(), "yyyy-MM"),
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
            />

            {RIGHT_STUBS.map((g, i) => (
              <DashCard
                key={g.id}
                id={g.id}
                color={g.color}
                icon={g.icon}
                label={g.label}
                summary={g.summary}
                stat={g.stat}
                unit={g.unit}
                timeLabel="—"
                dateLabel="not available"
                active={isActive(g.id)}
                index={i + 7}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
