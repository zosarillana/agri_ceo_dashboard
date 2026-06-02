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

import { useAuthStore } from "@/store/auth.store";
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

/* ─────────────────────────────────────────────────────────────────────────────
   DEPARTMENT → ALLOWED TILES
   Keys match department `name` values from the DB (lowercase).
───────────────────────────────────────────────────────────────────────────── */

const DEPARTMENT_TILES: Record<string, DashboardSegment[]> = {
  sales:           ["sales"],
  production:      ["production"],
  maintenance:     ["maintenance"],
  energy:          ["energy"],
  qc:              ["qc"],
  "quality control": ["qc"],
  procurement:     ["procurement"],
  workforce:       ["workforce"],
  trading:         ["trading"],
  accounts:        ["accounts"],
};

/* ─────────────────────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────────────────────── */

const COLOR_MAP: Record<SegmentColor, { bg: string; icon: string }> = {
  teal:   { bg: "bg-teal-500/10",   icon: "text-teal-700   dark:text-teal-400"   },
  amber:  { bg: "bg-amber-500/10",  icon: "text-amber-700  dark:text-amber-400"  },
  green:  { bg: "bg-green-500/10",  icon: "text-green-700  dark:text-green-400"  },
  purple: { bg: "bg-purple-500/10", icon: "text-purple-700 dark:text-purple-400" },
  blue:   { bg: "bg-blue-500/10",   icon: "text-blue-700   dark:text-blue-400"   },
  coral:  { bg: "bg-orange-500/10", icon: "text-orange-700 dark:text-orange-400" },
  pink:   { bg: "bg-pink-500/10",   icon: "text-pink-700   dark:text-pink-400"   },
  red:    { bg: "bg-red-500/10",    icon: "text-red-700    dark:text-red-400"    },
};

const STATUS_STYLES: Record<string, { dot: string; bg: string; text: string }> = {
  operational: { dot: "bg-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400" },
  maintenance: { dot: "bg-amber-500",   bg: "bg-amber-500/10",   text: "text-amber-700  dark:text-amber-400"   },
  standby:     { dot: "bg-blue-500",    bg: "bg-blue-500/10",    text: "text-blue-700   dark:text-blue-400"    },
  down:        { dot: "bg-red-500",     bg: "bg-red-500/10",     text: "text-red-700    dark:text-red-400"     },
};

const STATUS_ORDER = ["operational", "maintenance", "standby", "down"] as const;

const expandVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded:  { height: "auto", opacity: 1 },
};

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */

const getTodayISO = () => new Date().toLocaleDateString("en-CA");
const toISO = (d: Date) => new Date(d).toLocaleDateString("en-CA");

const fmt    = (n: number) => n.toLocaleString();
const fmtUSD = (n: number) => "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPHP = (n: number) => "₱" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d: Date) => d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

function relativeTime(date: Date) {
  const ms    = Date.now() - date.getTime();
  const mins  = Math.floor(ms / 60_000);
  const hours = Math.floor(ms / 3_600_000);
  const days  = Math.floor(ms / 86_400_000);
  if (mins  < 1)   return "Just now";
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days  === 1) return "Yesterday";
  return `${days}d ago`;
}

/**
 * Derive allowed tiles from the user's departments array.
 * A user with multiple departments sees the union of all their tiles.
 */
function getAllowedTiles(
  departments: { id: number; name: string }[] | null | undefined
): DashboardSegment[] {
  if (!departments?.length) return [];

  const tileSet = new Set<DashboardSegment>();
  for (const dept of departments) {
    const key = dept.name.toLowerCase();
    const tiles = DEPARTMENT_TILES[key] ?? [];
    for (const tile of tiles) tileSet.add(tile);
  }
  return Array.from(tileSet);
}

/* ─────────────────────────────────────────────────────────────────────────────
   SHARED SMALL COMPONENTS
───────────────────────────────────────────────────────────────────────────── */

function StatusPill({ status, count }: { status: string; count: number }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.standby;
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${s.bg}`}>
      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
      <span className={`text-xs font-medium capitalize ${s.text}`}>{status}</span>
      <span className={`text-xs font-bold ${s.text}`}>{count}</span>
    </div>
  );
}

function CardTimestamp({ timeLabel, dateLabel }: { timeLabel: string; dateLabel: string }) {
  return (
    <div className="flex gap-1 mt-1 justify-end">
      <span className="text-[10px] px-2 py-0.5 rounded bg-muted">{timeLabel}</span>
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
      <div className={`shrink-0 h-9 w-9 rounded-lg ${bg} flex items-center justify-center`}>
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
        to={`/auth/user/dashboard/${id}` as any}
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <ExternalLink className="h-3 w-3" />
        Open
      </Link>
    </div>
  );
}

function AnimatedCard({ index, children }: { index: number; children: React.ReactNode }) {
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
   CARD COMPONENTS
───────────────────────────────────────────────────────────────────────────── */

function DashCard({
  id, color, label, icon, summary, stat, unit,
  timeLabel, dateLabel, active, index, expandedContent,
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
      <Card className={`transition-all hover:shadow-md ${active ? "border-primary" : ""}`}>
        <CardContent className="px-5 py-4">
          <div className="flex justify-between cursor-pointer" onClick={() => setExpanded((v) => !v)}>
            <CardHeader color={color} icon={icon} label={label} summary={summary} />
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
                <div className="pt-3 mt-2 border-t border-border/50">{expandedContent}</div>
              </motion.div>
            )}
          </AnimatePresence>

          <ExpandRow id={id} expanded={expanded} onToggle={() => setExpanded((v) => !v)} />
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}

function SalesCard({
  active, index, totalUsd, totalKg, entryCount,
  exportCount, localCount, momChangePct, timeLabel, dateLabel,
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
      <Card className={`transition-all hover:shadow-md ${active ? "border-primary" : ""}`}>
        <CardContent className="px-5 py-4 space-y-3">
          <div className="flex justify-between cursor-pointer" onClick={() => setExpanded((v) => !v)}>
            <div className="flex grid grid-col-1">
              <CardHeader color="green" icon={TrendingUp} label="Sales" summary={`${entryCount} entries this month`} />
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-500/10">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  <span className="text-[10px] font-medium text-green-700 dark:text-green-400">Export</span>
                  <span className="text-[10px] font-bold text-green-700 dark:text-green-400">{exportCount}</span>
                </div>
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  <span className="text-[10px] font-medium text-blue-700 dark:text-blue-400">Local</span>
                  <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400">{localCount}</span>
                </div>
                <span className={`text-[10px] font-medium ${momChangePct == null ? "text-muted-foreground" : momChangePct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                  {momLabel}
                </span>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">· {fmt(totalKg)} kg</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{fmtUSD(totalUsd)}</p>
              <p className="text-xs text-muted-foreground">total sales this month</p>
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
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total (USD)</p>
                      <p className="text-sm font-semibold">{fmtUSD(totalUsd)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Volume</p>
                      <p className="text-sm font-semibold">{fmt(totalKg)} kg</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Entries</p>
                      <p className="text-sm font-semibold">{entryCount}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/30">
                    <div className="space-y-1">
                      <p className="text-[10px] text-green-600 dark:text-green-400 uppercase tracking-wide font-medium">Export</p>
                      <p className="text-sm font-semibold">{exportCount} entries</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-wide font-medium">Local</p>
                      <p className="text-sm font-semibold">{localCount} entries</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <ExpandRow id="sales" expanded={expanded} onToggle={() => setExpanded((v) => !v)} />
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}

function MaintenanceCard({
  active, index, checkedToday, totalUnits, completion, statusBreakdown, timeLabel, dateLabel,
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
      <Card className={`transition-all hover:shadow-md ${active ? "border-primary" : ""}`}>
        <CardContent className="px-5 py-4 space-y-3">
          <div className="flex justify-between cursor-pointer" onClick={() => setExpanded((v) => !v)}>
            <CardHeader color="red" icon={Wrench} label="Maintenance" summary={`${completion}% completion today`} />
            <div className="text-right pb-5">
              <p className="text-2xl font-bold">{checkedToday}/{totalUnits}</p>
              <p className="text-xs text-muted-foreground">units checked today</p>
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
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Unit status</p>
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
                      <StatusPill key={s} status={s} count={statusBreakdown?.[s] ?? 0} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <ExpandRow id="maintenance" expanded={expanded} onToggle={() => setExpanded((v) => !v)} />
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}

function EnergyCard({
  active, index, currentMonth, previousMonth, momChangePct, ytdTotal, timeLabel, dateLabel,
}: {
  active: boolean;
  index: number;
  currentMonth: { month: string; total_billed: number; total_kw: number; account2_billed: number; account3_billed: number; has_data: boolean };
  previousMonth: { month: string; total_billed: number; has_data: boolean };
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
      <Card className={`transition-all hover:shadow-md ${active ? "border-primary" : ""}`}>
        <CardContent className="px-5 py-4 space-y-3">
          <div className="flex justify-between cursor-pointer" onClick={() => setExpanded((v) => !v)}>
            <CardHeader
              color="amber"
              icon={Zap}
              label="Energy"
              summary={`${currentMonth.has_data ? currentMonth.month : "No data"} · YTD ${fmtPHP(ytdTotal)}`}
            />
            <div className="text-right">
              <p className="text-2xl font-bold">{currentMonth.has_data ? fmtPHP(currentMonth.total_billed) : "—"}</p>
              <p className="text-xs text-muted-foreground">total billed this month</p>
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
                      Current Month ({currentMonth.month})
                    </span>
                    <span className={`text-[10px] font-medium ${momChangePct == null ? "text-muted-foreground" : momChangePct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                      {momLabel}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground">Account 2</p>
                      <p className="text-sm font-semibold">{currentMonth.has_data ? fmtPHP(currentMonth.account2_billed) : "—"}</p>
                      {currentMonth.has_data && (
                        <p className="text-[10px] text-muted-foreground">{fmt(currentMonth.total_kw)} kWh</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground">Account 3</p>
                      <p className="text-sm font-semibold">{currentMonth.has_data ? fmtPHP(currentMonth.account3_billed) : "—"}</p>
                    </div>
                  </div>
                  {previousMonth.has_data && (
                    <div className="flex justify-between items-center pt-1 border-t border-border/30">
                      <span className="text-[10px] text-muted-foreground">Previous Month ({previousMonth.month})</span>
                      <span className="text-xs font-medium">{fmtPHP(previousMonth.total_billed)}</span>
                    </div>
                  )}
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

/* ─────────────────────────────────────────────────────────────────────────────
   STUB CONFIG
───────────────────────────────────────────────────────────────────────────── */

const STUB_CONFIGS: Record<string, { color: SegmentColor; icon: React.ElementType; label: string; summary: string }> = {
  accounts:    { color: "purple", icon: Wallet,         label: "Accounts",        summary: "Net position"        },
  qc:          { color: "coral",  icon: FlaskConical,   label: "Quality Control", summary: "QC status"           },
  procurement: { color: "amber",  icon: ShoppingCart,   label: "Procurement",     summary: "Supply chain status" },
  trading:     { color: "blue",   icon: ArrowLeftRight, label: "Trading",         summary: "Active trades"       },
  workforce:   { color: "pink",   icon: Users,          label: "Workforce",       summary: "Attendance tracking" },
};

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */

export default function UserDashboard() {
  const { user } = useAuthStore();
  const location = useLocation();

  // departments is now an array from the many-to-many relationship
  const departments = user?.departments ?? [];
  const allowedTiles: DashboardSegment[] = getAllowedTiles(departments);

  const isActive = (id: string) =>
    location.pathname === `/auth/user/dashboard/${id}`;

  const [time, setTime]                 = React.useState(() => new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date>(() => new Date());

  const selectedISO = toISO(selectedDate);
  const isToday     = selectedISO === getTodayISO();

  React.useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const { stats, loading: loadingStats, fetchStats } = useDashboardStore();

  const production  = stats?.production;
  const maintenance = stats?.maintenance;
  const sales       = stats?.sales;
  const energy      = stats?.energy;

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
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Today</p>
          <p className="text-sm font-semibold">
            {production?.today_production_output ? fmt(production.today_production_output) : "—"}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Yesterday</p>
          <p className="text-sm font-semibold">
            {production?.yesterday_production_output ? fmt(production.yesterday_production_output) : "—"}
          </p>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground">6 product lines running</p>
    </div>
  );

  /* ── No tiles fallback ─────────────────────────────────────────────────── */
  if (allowedTiles.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-foreground">No dashboard available</p>
          <p className="text-xs text-muted-foreground">
            {departments.length === 0
              ? "You have no departments assigned."
              : <>Your department{departments.length > 1 ? "s" : ""} (<span className="font-mono">{departments.map((d) => d.name).join(", ")}</span>) have no assigned tiles.</>
            }{" "}
            Contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  /* ── Render ────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto py-0 space-y-5">

        {/* HEADER */}
        <div className="flex items-center justify-between gap-3">
          {/* Department badges — one per department */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">
              {departments.length === 1 ? "Department:" : "Departments:"}
            </span>
            {departments.length > 0 ? (
              departments.map((d) => (
                <span
                  key={d.id}
                  className="text-xs font-semibold capitalize px-2 py-0.5 rounded-md bg-muted"
                >
                  {d.name}
                </span>
              ))
            ) : (
              <span className="text-xs text-muted-foreground italic">None assigned</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-muted-foreground flex items-center gap-2">
              Live dashboard —
              <span className="font-medium text-foreground">
                {time.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
              <span className="text-muted-foreground">{format(selectedDate, "PPP")}</span>
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
        </div>

        {/* TILES */}
        <div className="flex flex-col gap-3">

          {allowedTiles.includes("production") && (
            <DashCard
              id="production"
              color="teal"
              icon={Factory}
              label="Production Output"
              summary="6 product lines running"
              stat={productionStat}
              unit={productionUnit}
              timeLabel={production?.last_updated_at ? relativeTime(new Date(production.last_updated_at)) : "—"}
              dateLabel={fmtDate(new Date(selectedISO + "T00:00:00"))}
              active={isActive("production")}
              index={0}
              expandedContent={productionExpanded}
            />
          )}

          {allowedTiles.includes("sales") && (
            <SalesCard
              active={isActive("sales")}
              index={1}
              totalUsd={sales?.this_month.total_usd ?? 0}
              totalKg={sales?.this_month.total_kg ?? 0}
              entryCount={sales?.this_month.entry_count ?? 0}
              exportCount={sales?.this_month.export_count ?? 0}
              localCount={sales?.this_month.local_count ?? 0}
              momChangePct={sales?.mom_change_pct ?? null}
              timeLabel={sales?.last_updated_at ? relativeTime(new Date(sales.last_updated_at)) : "—"}
              dateLabel={sales?.last_updated_at ? fmtDate(new Date(sales.last_updated_at)) : "not available"}
            />
          )}

          {allowedTiles.includes("maintenance") && (
            <MaintenanceCard
              active={isActive("maintenance")}
              index={2}
              checkedToday={maintenance?.checked_today ?? 0}
              totalUnits={maintenance?.total_units ?? 0}
              completion={maintenance?.completion ?? 0}
              statusBreakdown={maintenance?.status_breakdown}
              timeLabel={maintenance?.last_updated_at ? relativeTime(new Date(maintenance.last_updated_at)) : "—"}
              dateLabel={maintenance?.last_updated_at ? fmtDate(new Date(maintenance.last_updated_at)) : "not available"}
            />
          )}

          {allowedTiles.includes("energy") && (
            <EnergyCard
              active={isActive("energy")}
              index={3}
              currentMonth={energy?.current_month ?? {
                month: format(new Date(), "yyyy-MM"),
                total_billed: 0,
                total_kw: 0,
                account2_billed: 0,
                account3_billed: 0,
                has_data: false,
              }}
              previousMonth={energy?.previous_month ?? {
                month: format(new Date(), "yyyy-MM"),
                total_billed: 0,
                has_data: false,
              }}
              momChangePct={energy?.mom_change_pct ?? null}
              ytdTotal={energy?.ytd_summary?.total_billed_amount ?? 0}
              timeLabel={energy?.last_updated_at ? relativeTime(new Date(energy.last_updated_at)) : "—"}
              dateLabel={energy?.last_updated_at ? fmtDate(new Date(energy.last_updated_at)) : "not available"}
            />
          )}

          {/* Stub tiles */}
          {(["accounts", "qc", "procurement", "trading", "workforce"] as DashboardSegment[])
            .filter((id) => allowedTiles.includes(id))
            .map((id, i) => {
              const cfg = STUB_CONFIGS[id];
              return (
                <DashCard
                  key={id}
                  id={id}
                  color={cfg.color}
                  icon={cfg.icon}
                  label={cfg.label}
                  summary={cfg.summary}
                  stat="—"
                  unit="—"
                  timeLabel="—"
                  dateLabel="not available"
                  active={isActive(id)}
                  index={i + 4}
                />
              );
            })}

        </div>
      </div>
    </div>
  );
}