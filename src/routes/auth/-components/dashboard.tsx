import * as React from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";

import { mockData } from "../-data/-mock-data";
import { useDashboardStore } from "@/store/dashboard.store";
import type { DashboardStats } from "@/types/dashboard.types";

/* ── helpers ─────────────────────────────────────────────────────────────────── */

function getTodayISO() {
  return new Date().toLocaleDateString("en-CA");
}

function toISO(d: Date) {
  return d.toLocaleDateString("en-CA");
}

/* ── formatters ─────────────────────────────────────────────────────────────── */

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

  if (diffMins < 1)   return { label: "Just now",          fresh: true  };
  if (diffMins < 60)  return { label: `${diffMins}m ago`,   fresh: true  };
  if (diffHours < 24) return { label: `${diffHours}h ago`,  fresh: true  };
  if (diffDays === 1) return { label: "Yesterday",          fresh: false };
  return                     { label: `${diffDays}d ago`,   fresh: false };
}

/* ── group builder ───────────────────────────────────────────────────────────── */

function buildGroups(
  stats: DashboardStats | null,
  loadingStats: boolean,
  selectedISO: string,
) {
  const isToday = selectedISO === getTodayISO();
  const now = new Date();
  const minsAgo  = (m: number) => new Date(now.getTime() - m * 60_000);
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000);
  const daysAgo  = (d: number) => new Date(now.getTime() - d * 86_400_000);

  const productionStat = loadingStats
    ? "—"
    : stats?.today_production_output
      ? fmt(stats.today_production_output)
      : stats?.yesterday_production_output && isToday
        ? `${fmt(stats.yesterday_production_output)} (yesterday)`
        : "No data";

  const productionUnit = isToday
    ? "units today"
    : `units on ${format(new Date(selectedISO + "T00:00:00"), "MMM d")}`;

  // The selected date as a Date object for display — used as dateLabel override
  const selectedDate = new Date(selectedISO + "T00:00:00");

  return [
    {
      id: "production",
      label: "Production Output",
      icon: Factory,
      summary: "6 product lines running",
      stat: productionStat,
      unit: productionUnit,
      updatedAt: stats?.last_updated_at
        ? new Date(stats.last_updated_at)
        : daysAgo(1),
      // Override the date badge to show the selected date, not the entry timestamp
      dateOverride: selectedDate,
    },
    {
      id: "procurement",
      label: "Procurement",
      icon: ShoppingCart,
      summary: "Supply chain status",
      stat: `${mockData.procurement.length * 47}`,
      unit: "orders this month",
      updatedAt: minsAgo(18),
      dateOverride: null,
    },
    {
      id: "sales",
      label: "Sales",
      icon: TrendingUp,
      summary: `${mockData.sales.length} product lines`,
      stat: fmtPHP(mockData.sales.reduce((a, b) => a + b.value, 0) * 12),
      unit: "revenue this month",
      updatedAt: hoursAgo(1),
      dateOverride: null,
    },
    {
      id: "accounts",
      label: "Accounts",
      icon: Wallet,
      summary: "Net position",
      stat: fmtPHP(5_618_000 * 8),
      unit: "total cashflow",
      updatedAt: hoursAgo(4),
      dateOverride: null,
    },
    {
      id: "trading",
      label: "Trading",
      icon: ArrowLeftRight,
      summary: "Active trades",
      stat: fmt(mockData.trading.length * 340),
      unit: "units traded today",
      updatedAt: minsAgo(7),
      dateOverride: null,
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
    },
    {
      id: "workforce",
      label: "Workforce",
      icon: Users,
      summary: "Attendance tracking",
      stat: `${mockData.workforce.presentToday * 3}`,
      unit: "employees across all sites",
      updatedAt: hoursAgo(2),
      dateOverride: null,
    },
    {
      id: "maintenance",
      label: "Maintenance",
      icon: Wrench,
      summary: "Equipment status",
      stat: `${mockData.maintenance.length * 14}`,
      unit: "units monitored",
      updatedAt: daysAgo(3),
      dateOverride: null,
    },
    {
      id: "energy",
      label: "Energy",
      icon: Zap,
      summary: "Accounts 2 & 3",
      stat: fmtPHP(
        mockData.energy.account2.reduce((s, r) => s + r.billedAmount, 0) +
          mockData.energy.account3.reduce((s, r) => s + r.billedAmount, 0),
      ),
      unit: "total billing YTD",
      updatedAt: daysAgo(1),
      dateOverride: null,
    },
  ];
}

type DashboardSegment =
  | "production"
  | "procurement"
  | "sales"
  | "accounts"
  | "trading"
  | "qc"
  | "workforce"
  | "maintenance"
  | "energy";

type DashboardRoute = `/auth/admin/dashboard/${DashboardSegment}`;

/* ── component ──────────────────────────────────────────────────────────────── */

export default function CEODashboard() {
  const location = useLocation();

  const [time, setTime] = React.useState(() => new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date>(() => new Date());
  const selectedISO = toISO(selectedDate);

  const { stats, loading: loadingStats, fetchStats } = useDashboardStore();

  const groupData = React.useMemo(
    () => buildGroups(stats, loadingStats, selectedISO),
    [stats, loadingStats, selectedISO],
  );

  React.useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1_000);
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

  const isActive = (id: string) =>
    location.pathname === `/auth/admin/dashboard/${id}`;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto py-0 space-y-5">

        {/* Header — clock + date picker */}
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                >
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
          {groupData.map((g, i) => {
            const Icon = g.icon;
            const active = isActive(g.id);
            const { label: timeLabel, fresh } = relativeTime(g.updatedAt);
            // Production shows the selected date; all others show their updatedAt
            const dateLabel = fmtDate(g.dateOverride ?? g.updatedAt);

            return (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ y: -3, scale: 1.005 }}
              >
                <Link
                  to={`/auth/admin/dashboard/${g.id}` as DashboardRoute}
                  className="block"
                >
                  <Card
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/60 ${
                      active ? "border-primary shadow-sm" : ""
                    }`}
                  >
                    <CardContent className="px-5 py-4">
                      <div className="flex items-start justify-between gap-4">

                        {/* Left — icon + label */}
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="shrink-0 rounded-lg bg-muted p-2 mt-0.5">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-lg leading-tight">
                              {g.label}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {g.summary}
                            </p>
                          </div>
                        </div>

                        {/* Right — stat + timestamp */}
                        <div className="text-right shrink-0">
                          <p className="text-2xl font-bold tracking-tight leading-tight">
                            {g.stat}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {g.unit}
                          </p>

                          <div className="flex items-center justify-end gap-1.5 mt-1.5">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                                fresh
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              <span
                                className={`h-1 w-1 rounded-full inline-block ${
                                  fresh
                                    ? "bg-emerald-500"
                                    : "bg-muted-foreground/50"
                                }`}
                              />
                              {timeLabel}
                            </span>
                            <span className="text-[10px] text-muted-foreground/70">
                              {dateLabel}
                            </span>
                          </div>
                        </div>

                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>

      </div>
    </div>
  );
}