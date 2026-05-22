"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

import {
  Factory,
  ShoppingCart,
  TrendingUp,
  Wallet,
  ArrowLeftRight,
  FlaskConical,
  Users,
  Wrench,
  Lock,
  Zap,
  Calendar as CalendarIcon,
  ChevronDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { mockData } from "@/routes/auth/-data/-mock-data";
import { dashboardService } from "@/services/dashboard.service";
import type { DashboardStats } from "@/types/dashboard.types";

/* ── helpers ─────────────────────────────────────────────────────────────────── */

function getTodayISO() {
  return new Date().toLocaleDateString("en-CA");
}

function dateToISO(d: Date) {
  return new Date(d).toLocaleDateString("en-CA");
}

/* ── formatters ──────────────────────────────────────────────────────────────── */

function fmt(n: number) {
  return n.toLocaleString();
}

function fmtPHP(n: number) {
  return "₱" + n.toLocaleString();
}

function fmtDate(date: Date): string {
  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function relativeTime(date: Date): { label: string; fresh: boolean } {
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return { label: "Just now", fresh: true };
  if (diffMins < 60) return { label: `${diffMins}m ago`, fresh: true };
  if (diffHours < 24) return { label: `${diffHours}h ago`, fresh: true };
  if (diffDays === 1) return { label: "Yesterday", fresh: false };
  return { label: `${diffDays}d ago`, fresh: false };
}

/* ── expand animation ────────────────────────────────────────────────────────── */

const expandVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: { height: "auto", opacity: 1 },
};

/* ── group builder ───────────────────────────────────────────────────────────── */

type GroupItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  summary: string;
  stat: string;
  unit: string;
  updatedAt: Date;
  dateOverride: Date | null;
  expandedRows: { label: string; value: string }[];
};

function buildGroups(
  stats: DashboardStats | null,
  loadingStats: boolean,
  selectedISO: string,
): GroupItem[] {
  const isToday = selectedISO === getTodayISO();

  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);

  const production = stats?.production;
  const maintenance = stats?.maintenance;

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

  const selectedDate = new Date(selectedISO + "T00:00:00");

  const procTotal = mockData.procurement.length * 47;
  const salesTotal = mockData.sales.reduce((a, b) => a + b.value, 0) * 12;
  const account2Total = mockData.energy.account2.reduce((s, r) => s + r.billedAmount, 0);
  const account3Total = mockData.energy.account3.reduce((s, r) => s + r.billedAmount, 0);

  return [
    {
      id: "production",
      label: "Production Output",
      icon: Factory,
      summary: "6 product lines running",
      stat: productionStat,
      unit: productionUnit,
      updatedAt: production?.last_updated_at
        ? new Date(production.last_updated_at)
        : daysAgo(1),
      dateOverride: selectedDate,
      expandedRows: [
        {
          label: "Today",
          value: production?.today_production_output
            ? fmt(production.today_production_output)
            : "—",
        },
        {
          label: "Yesterday",
          value: production?.yesterday_production_output
            ? fmt(production.yesterday_production_output)
            : "—",
        },
        { label: "Active lines", value: "6" },
      ],
    },

    {
      id: "procurement",
      label: "Procurement",
      icon: ShoppingCart,
      summary: "Supply chain status",
      stat: `${procTotal}`,
      unit: "orders this month",
      updatedAt: daysAgo(0),
      dateOverride: null,
      expandedRows: [
        { label: "Orders this month", value: fmt(procTotal) },
        { label: "Suppliers active", value: fmt(mockData.procurement.length) },
        { label: "Avg. order size", value: "47 units" },
      ],
    },

    {
      id: "sales",
      label: "Sales",
      icon: TrendingUp,
      summary: `${mockData.sales.length} product lines`,
      stat: fmtPHP(salesTotal),
      unit: "revenue this month",
      updatedAt: daysAgo(0),
      dateOverride: null,
      expandedRows: [
        { label: "Revenue this month", value: fmtPHP(salesTotal) },
        { label: "Product lines", value: fmt(mockData.sales.length) },
        {
          label: "Avg. per line",
          value: fmtPHP(Math.round(salesTotal / mockData.sales.length)),
        },
      ],
    },

    {
      id: "accounts",
      label: "Accounts",
      icon: Wallet,
      summary: "Net position",
      stat: fmtPHP(5_618_000 * 8),
      unit: "total cashflow",
      updatedAt: daysAgo(1),
      dateOverride: null,
      expandedRows: [
        { label: "Total cashflow", value: fmtPHP(5_618_000 * 8) },
        { label: "Base amount", value: fmtPHP(5_618_000) },
        { label: "Multiplier", value: "×8" },
      ],
    },

    {
      id: "trading",
      label: "Trading",
      icon: ArrowLeftRight,
      summary: "Active trades",
      stat: fmt(mockData.trading.length * 340),
      unit: "units traded today",
      updatedAt: daysAgo(0),
      dateOverride: null,
      expandedRows: [
        { label: "Units traded today", value: fmt(mockData.trading.length * 340) },
        { label: "Active trades", value: fmt(mockData.trading.length) },
        { label: "Avg. trade size", value: "340 units" },
      ],
    },

    {
      id: "qc",
      label: "Quality Control",
      icon: FlaskConical,
      summary: "QC status",
      stat: `${mockData.qc.passRate}%`,
      unit: `${fmt(mockData.qc.samplesTested * 24)} samples tested`,
      updatedAt: daysAgo(1),
      dateOverride: null,
      expandedRows: [
        { label: "Pass rate", value: `${mockData.qc.passRate}%` },
        { label: "Samples tested", value: fmt(mockData.qc.samplesTested * 24) },
        { label: "Base samples", value: fmt(mockData.qc.samplesTested) },
      ],
    },

    {
      id: "workforce",
      label: "Workforce",
      icon: Users,
      summary: "Attendance tracking",
      stat: `${mockData.workforce.presentToday * 3}`,
      unit: "employees across all sites",
      updatedAt: daysAgo(0),
      dateOverride: null,
      expandedRows: [
        { label: "Total employees", value: fmt(mockData.workforce.presentToday * 3) },
        { label: "Present today", value: fmt(mockData.workforce.presentToday) },
        { label: "Sites", value: "3" },
      ],
    },

    {
      id: "maintenance",
      label: "Maintenance",
      icon: Wrench,
      summary: maintenance
        ? `${maintenance.completion}% completion today`
        : "Loading maintenance...",
      stat: maintenance
        ? `${maintenance.checked_today}/${maintenance.total_units}`
        : "—",
      unit: "units checked today",
      updatedAt: daysAgo(0),
      dateOverride: null,
      expandedRows: [
        {
          label: "Checked today",
          value: maintenance ? fmt(maintenance.checked_today) : "—",
        },
        {
          label: "Total units",
          value: maintenance ? fmt(maintenance.total_units) : "—",
        },
        {
          label: "Completion",
          value: maintenance ? `${maintenance.completion}%` : "—",
        },
      ],
    },

    {
      id: "energy",
      label: "Energy",
      icon: Zap,
      summary: "Accounts 2 & 3",
      stat: fmtPHP(account2Total + account3Total),
      unit: "total billing YTD",
      updatedAt: daysAgo(1),
      dateOverride: null,
      expandedRows: [
        { label: "Account 2", value: fmtPHP(account2Total) },
        { label: "Account 3", value: fmtPHP(account3Total) },
        { label: "YTD Total", value: fmtPHP(account2Total + account3Total) },
      ],
    },
  ];
}

/* ── expandable card ─────────────────────────────────────────────────────────── */

function LandingCard({
  group,
  index,
}: {
  group: GroupItem;
  index: number;
}) {
  const [expanded, setExpanded] = React.useState(false);

  const Icon = group.icon;
  const { label: timeLabel } = relativeTime(group.updatedAt);
  const dateLabel = fmtDate(group.dateOverride ?? group.updatedAt);

  function handleSignInToast(e: React.MouseEvent) {
    e.stopPropagation();
    toast(`${group.label} — Sign in required`, {
      description: "Sign in to view detailed reports and insights.",
      icon: <Lock className="h-4 w-4" />,
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ y: -2, scale: 1.003 }}
    >
      <Card className="hover:shadow-md transition-all">
        <CardContent className="px-5 py-4">
          {/* Main row — click to expand */}
          <div
            className="flex justify-between cursor-pointer"
            onClick={() => setExpanded((v) => !v)}
          >
            <div className="flex gap-3">
              <div className="shrink-0 h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-lg">{group.label}</p>
                <p className="text-xs text-muted-foreground">{group.summary}</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-2xl font-bold">{group.stat}</p>
              <p className="text-xs text-muted-foreground">{group.unit}</p>
              <div className="flex gap-1 mt-1 justify-end">
                <span className="text-[10px] px-2 py-0.5 rounded bg-muted">
                  {timeLabel}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {dateLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Expanded detail */}
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                key="expanded"
                variants={expandVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="pt-3 mt-2 border-t border-border/50 grid grid-cols-3 gap-3">
                  {group.expandedRows.map((row) => (
                    <div key={row.label} className="space-y-0.5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        {row.label}
                      </p>
                      <p className="text-sm font-semibold">{row.value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Expand / sign-in row */}
          <div className="flex items-center justify-between pt-2 border-t border-border/40 mt-2">
            <button
              onClick={() => setExpanded((v) => !v)}
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

            <button
              onClick={handleSignInToast}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <Lock className="h-3 w-3" />
              Sign in to view
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ── component ───────────────────────────────────────────────────────────────── */

export function LandingDashboard() {
  const [time, setTime] = React.useState(() => new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date>(
    () => new Date(),
  );

  const selectedISO = dateToISO(selectedDate);

  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = React.useState(true);

  const cache = React.useRef<Record<string, DashboardStats>>({});

  const groupData = React.useMemo(
    () => buildGroups(stats, loadingStats, selectedISO),
    [stats, loadingStats, selectedISO],
  );

  React.useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  async function fetchForDate(iso: string) {
    if (cache.current[iso]) {
      setStats(cache.current[iso]);
      setLoadingStats(false);
      return;
    }

    setLoadingStats(true);

    try {
      const data = await dashboardService.getStats(iso);
      cache.current[iso] = data;
      setStats(data);
    } catch (err) {
      console.error("Dashboard load failed:", err);
    } finally {
      setLoadingStats(false);
    }
  }

  React.useEffect(() => {
    fetchForDate(getTodayISO());
  }, []);

  function handleDateSelect(d: Date | undefined) {
    if (!d) return;
    setSelectedDate(d);
    fetchForDate(dateToISO(d));
  }

  return (
    <div className="w-full">
      <div className="space-y-5">
        {/* HEADER */}
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

        {/* GRID */}
        <div className="grid md:grid-cols-2 gap-3">
          {groupData.map((g, i) => (
            <LandingCard key={g.id} group={g} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}