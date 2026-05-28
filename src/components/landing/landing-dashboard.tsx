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

import { dashboardService } from "@/services/dashboard.service";
import type { DashboardStats } from "@/types/dashboard.types";
import { mockData } from "@/routes/auth/-data/-mock-data";

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

/* ─────────────────────────────────────────────────────────────────────────────
   CONSTANTS & HELPERS
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

function getTodayISO()          { return new Date().toLocaleDateString("en-CA"); }
function dateToISO(d: Date)     { return new Date(d).toLocaleDateString("en-CA"); }
function toMonthKey(s: string)  { return s.slice(0, 7); }
function currentMonthKey()      { return toMonthKey(getTodayISO()); }
function fmt(n: number)         { return n.toLocaleString(); }
function fmtUSD(n: number)      { return "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtPHP(n: number)      { return "₱" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDate(d: Date)       { return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }); }
function fmtMonthLabel(ym: string) {
  const [y, m] = ym.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-PH", { month: "short", year: "numeric" });
}
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

const expandVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded:  { height: "auto", opacity: 1 },
};

/* ─────────────────────────────────────────────────────────────────────────────
   MOCK DATA — derived from mockData import
   Stub tiles use this until real APIs are wired up.
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
  (a) => a.type === "receivable" && a.due !== "Received" && new Date(a.due) < new Date(),
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

// ── Workforce ─────────────────────────────────────────────────────────────────
const _wf = mockData.workforce;
// dept with lowest attendance ratio
const _wfLowestDept = [..._wf.departments].sort(
  (a, b) => (a.present / a.total) - (b.present / b.total),
)[0];

const MOCK = {
  accounts: {
    stat: fmtPHP(_acctNet),
    unit: "net cash position",
    summary: "Accounts overview",
  },
  procurement: {
    stat: String(_procOpen),
    unit: "open purchase orders",
    summary: `${_procDelayed} delayed · ${_procPending} pending`,
  },
  trading: {
    stat: String(_tradeActiveCount),
    unit: "active trade operations",
    summary: `${fmt(_tradeTotalVolumeIn)} kg total input`,
  },
  workforce: {
    stat: `${_wf.presentToday} / ${_wf.totalHeadcount}`,
    unit: "present today",
    summary: `${Math.round((_wf.presentToday / _wf.totalHeadcount) * 100)}% attendance rate`,
  },
} as const;

/* ─────────────────────────────────────────────────────────────────────────────
   SMALL COMPONENTS
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

function HistoricalBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400">
      <CalendarIcon className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}

/** Shown inside expanded sections of stub tiles */
function SampleBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border/60">
      Sample data · Sign in for live figures
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

function CardHeaderBlock({
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
  expanded,
  onToggle,
  onSignIn,
}: {
  id: string;
  expanded: boolean;
  onToggle: () => void;
  onSignIn: () => void;
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
      <button
        onClick={onSignIn}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <Lock className="h-3 w-3" />
        Sign in to view
      </button>
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
   PLAIN DASH CARD  (production + live tiles)
───────────────────────────────────────────────────────────────────────────── */

function DashCard({
  id, color, label, icon, summary, stat, unit,
  timeLabel, dateLabel, index, expandedContent, onSignIn,
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
  index: number;
  expandedContent?: React.ReactNode;
  onSignIn: () => void;
}) {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <AnimatedCard index={index}>
      <Card className="transition-all hover:shadow-md">
        <CardContent className="px-5 py-4">
          <div className="flex justify-between cursor-pointer" onClick={() => setExpanded((v) => !v)}>
            <CardHeaderBlock color={color} icon={icon} label={label} summary={summary} />
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

          <ExpandRow id={id} expanded={expanded} onToggle={() => setExpanded((v) => !v)} onSignIn={onSignIn} />
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   STUB CARD  — mock data + SampleBadge
───────────────────────────────────────────────────────────────────────────── */

function StubCard({
  id, color, label, icon, index, onSignIn,
  stat, unit, summary, timeLabel, expandedContent,
}: {
  id: string;
  color: SegmentColor;
  label: string;
  icon: React.ElementType;
  index: number;
  onSignIn: () => void;
  stat: string;
  unit: string;
  summary: string;
  timeLabel: string;
  expandedContent: React.ReactNode;
}) {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <AnimatedCard index={index}>
      <Card className="transition-all hover:shadow-md border-dashed">
        <CardContent className="px-5 py-4">
          <div className="flex justify-between cursor-pointer" onClick={() => setExpanded((v) => !v)}>
            <CardHeaderBlock color={color} icon={icon} label={label} summary={summary} />
            <div className="text-right">
              <p className="text-2xl font-bold text-muted-foreground">{stat}</p>
              <p className="text-xs text-muted-foreground">{unit}</p>
              <CardTimestamp timeLabel={timeLabel} dateLabel="sample" />
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

          <ExpandRow id={id} expanded={expanded} onToggle={() => setExpanded((v) => !v)} onSignIn={onSignIn} />
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   QC CARD (using real API data)
───────────────────────────────────────────────────────────────────────────── */

function QcCard({
  index,
  qcStats,
  timeLabel,
  dateLabel,
  selectedMonthKey,
  onSignIn,
}: {
  index: number;
  qcStats: any;
  timeLabel: string;
  dateLabel: string;
  selectedMonthKey: string;
  onSignIn: () => void;
}) {
  const [expanded, setExpanded] = React.useState(false);

  if (!qcStats || !qcStats.current_month) {
    return (
      <AnimatedCard index={index}>
        <Card className="transition-all hover:shadow-md">
          <CardContent className="px-5 py-4">
            <div className="flex justify-between">
              <CardHeaderBlock
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

  const currentMonth = qcStats.current_month;
  const previousMonth = qcStats.previous_month;
  const momChange = qcStats.mom_pass_rate_change;
  const hasData = currentMonth.samples_tested > 0;
  const isCurrentMonth = selectedMonthKey === currentMonth.month;

  const displayPassRate = isCurrentMonth
    ? currentMonth.pass_rate
    : (qcStats.monthly_breakdown?.find((m: any) => m.month === selectedMonthKey)
        ?.pass_rate ?? null);

  const momLabel = momChange != null
    ? `${momChange >= 0 ? "+" : ""}${momChange}% vs last month`
    : "No prior month data";

  return (
    <AnimatedCard index={index}>
      <Card className="transition-all hover:shadow-md">
        <CardContent className="px-5 py-4 space-y-3">
          <div className="flex justify-between cursor-pointer" onClick={() => setExpanded((v) => !v)}>
            <CardHeaderBlock
              color="coral"
              icon={FlaskConical}
              label="Quality Control"
              summary={`${currentMonth.samples_tested.toLocaleString()} samples · ${currentMonth.pass_rate}% pass rate`}
            />
            <div className="text-right">
              <p className="text-2xl font-bold">
                {displayPassRate != null ? `${displayPassRate}%` : "—"}
              </p>
              <p className="text-xs text-muted-foreground">pass rate</p>
              {!isCurrentMonth && displayPassRate != null && (
                <div className="flex justify-end mt-1">
                  <HistoricalBadge label={fmtMonthLabel(selectedMonthKey)} />
                </div>
              )}
              <CardTimestamp timeLabel={timeLabel} dateLabel={dateLabel} />
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
                <div className="pt-3 border-t border-border/50 space-y-3">
                  {/* Pass Rate Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Pass Rate</span>
                      <span className="font-medium text-foreground">
                        {currentMonth.pass_rate}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full bg-emerald-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${currentMonth.pass_rate}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        Tested
                      </p>
                      <p className="text-sm font-semibold">
                        {currentMonth.samples_tested.toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                        Passed
                      </p>
                      <p className="text-sm font-semibold">
                        {currentMonth.samples_passed.toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-red-600 dark:text-red-400 uppercase tracking-wide">
                        Failed
                      </p>
                      <p className="text-sm font-semibold">
                        {currentMonth.samples_failed.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Rejection Rate */}
                  <div className="pt-1 space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Rejection Rate</span>
                      <span className="font-medium text-foreground">
                        {currentMonth.rejection_rate}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full bg-red-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${currentMonth.rejection_rate}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  {/* Products Tested */}
                  {qcStats.product_performance && qcStats.product_performance.length > 0 && (
                    <div className="pt-1 space-y-2">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                        Products Tested ({currentMonth.products_tested})
                      </p>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                        {qcStats.product_performance.slice(0, 5).map((product: any, idx: number) => (
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
                                transition={{ duration: 0.3, ease: "easeOut" }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Low Pass Rate Warning */}
                  {currentMonth.pass_rate < 85 && (
                    <div className="pt-2 mt-1 p-2 rounded-md bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-600 dark:text-amber-400 text-[10px] font-medium">
                          ⚠️ Quality Alert
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Pass rate below 85% ({currentMonth.pass_rate}%). 
                        Review quality control processes.
                      </p>
                    </div>
                  )}

                  {/* Monthly Comparison */}
                  {isCurrentMonth && previousMonth.samples_tested > 0 && (
                    <div className="flex justify-between items-center pt-1 border-t border-border/30">
                      <span className="text-[10px] text-muted-foreground">
                        Previous Month ({fmtMonthLabel(previousMonth.month)})
                      </span>
                      <div className="text-right">
                        <span className="text-xs font-medium">
                          {previousMonth.pass_rate}% pass rate
                        </span>
                        <span
                          className={`text-[10px] ml-2 ${
                            momChange >= 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {momLabel}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Daily Trend (last 7 days) */}
                  {qcStats.daily_trend && qcStats.daily_trend.length > 0 && (
                    <div className="pt-1 space-y-2">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                        Last 7 Days Trend
                      </p>
                      <div className="space-y-1">
                        {qcStats.daily_trend.slice(-7).map((day: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-[10px]">
                            <span className="text-muted-foreground">
                              {format(new Date(day.date), "MMM d")}
                            </span>
                            <div className="flex-1 mx-2 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${day.pass_rate}%` }}
                              />
                            </div>
                            <span className="font-medium">{day.pass_rate}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!hasData && (
                    <p className="text-[10px] text-muted-foreground italic">
                      No QC data recorded for {fmtMonthLabel(currentMonth.month)}.
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <ExpandRow id="qc" expanded={expanded} onToggle={() => setExpanded((v) => !v)} onSignIn={onSignIn} />
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   EXPANDED CONTENT — one per stub
───────────────────────────────────────────────────────────────────────────── */

const AccountsExpanded = () => {
  const items = mockData.accounts;
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Receivables</p>
          <p className="text-sm font-semibold">{fmtPHP(_acctReceivables)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Payables + Exp.</p>
          <p className="text-sm font-semibold">{fmtPHP(_acctPayables)}</p>
        </div>
      </div>
      <div className="pt-1 border-t border-border/30 space-y-1.5">
        {items.slice(0, 3).map((a) => (
          <MockRow
            key={a.description}
            label={a.description.length > 32 ? a.description.slice(0, 32) + "…" : a.description}
            value={`${a.type === "payable" || a.type === "expense" ? "−" : "+"}${fmtPHP(a.amount)}`}
          />
        ))}
        <MockRow label="Overdue accounts" value={`${_acctOverdue} invoices`} />
      </div>
    </div>
  );
};

const ProcurementExpanded = () => {
  const STATUS_COLOR: Record<string, string> = {
    received: "text-emerald-600 dark:text-emerald-400",
    pending:  "text-amber-600 dark:text-amber-400",
    delayed:  "text-red-600 dark:text-red-400",
  };
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Received</p>
          <p className="text-sm font-semibold">{_proc.filter((p) => p.status === "received").length}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-amber-600 dark:text-amber-400">Pending</p>
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
            <span className="text-[10px] text-muted-foreground truncate max-w-[160px]">{p.name}</span>
            <span className={`text-[10px] font-semibold capitalize ${STATUS_COLOR[p.status]}`}>
              {p.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const TradingExpanded = () => {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Operations</p>
          <p className="text-sm font-semibold">{_tradeActiveCount}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Input</p>
          <p className="text-sm font-semibold">{fmt(_tradeTotalVolumeIn)} kg</p>
        </div>
      </div>
      <div className="pt-1 border-t border-border/30 space-y-1.5">
        {mockData.trading.filter((t) => t.volumeIn > 0).map((t) => (
          <div key={t.name} className="flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground truncate max-w-[160px]">{t.name}</span>
            <span className="text-[10px] font-semibold">
              {fmt(t.volumeIn)} → {fmt(t.volumeOut)} {t.unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const WorkforceExpanded = () => {
  const w = mockData.workforce;
  const attendancePct = Math.round((w.presentToday / w.totalHeadcount) * 100);
  const absent = w.totalHeadcount - w.presentToday;
  return (
    <div className="space-y-2">
      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full bg-emerald-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${attendancePct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Present</p>
          <p className="text-sm font-semibold">{w.presentToday}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-red-600 dark:text-red-400">Absent</p>
          <p className="text-sm font-semibold">{absent}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground">Incidents</p>
          <p className="text-sm font-semibold">{w.safetyIncidents}</p>
        </div>
      </div>
      <div className="pt-1 border-t border-border/30 space-y-1.5">
        {w.departments.map((d) => (
          <div key={d.name} className="flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground">{d.name}</span>
            <span className="text-[10px] font-semibold">
              {d.present}/{d.total}
              <span className="text-muted-foreground ml-1">
                ({Math.round((d.present / d.total) * 100)}%)
              </span>
            </span>
          </div>
        ))}
        {_wfLowestDept && (
          <MockRow label="Lowest attendance" value={_wfLowestDept.name} />
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   SALES CARD
───────────────────────────────────────────────────────────────────────────── */

function SalesCard({
  index,
  thisMonth,
  lastMonth,
  momChangePct,
  monthlyBreakdown,
  timeLabel,
  dateLabel,
  selectedMonthKey,
  onSignIn,
}: {
  index: number;
  thisMonth: { total_usd: number; total_kg: number; entry_count: number; export_count: number; local_count: number };
  lastMonth: { total_usd: number; total_kg: number; entry_count: number };
  momChangePct: number | null;
  monthlyBreakdown: Array<{ month: string; total_usd: number; total_kg: number; entry_count: number }>;
  timeLabel: string;
  dateLabel: string;
  selectedMonthKey: string;
  onSignIn: () => void;
}) {
  const [expanded, setExpanded] = React.useState(false);

  const isCurrentMonth = selectedMonthKey === currentMonthKey();
  const isHistorical   = !isCurrentMonth;

  const histEntry = React.useMemo(
    () => monthlyBreakdown.find((m) => m.month === selectedMonthKey),
    [monthlyBreakdown, selectedMonthKey],
  );

  const displayUsd     = isCurrentMonth ? thisMonth.total_usd    : (histEntry?.total_usd    ?? null);
  const displayKg      = isCurrentMonth ? thisMonth.total_kg     : (histEntry?.total_kg     ?? null);
  const displayEntries = isCurrentMonth ? thisMonth.entry_count  : (histEntry?.entry_count  ?? null);
  const displayExport  = isCurrentMonth ? thisMonth.export_count : null;
  const displayLocal   = isCurrentMonth ? thisMonth.local_count  : null;
  const displayMonthLabel = fmtMonthLabel(selectedMonthKey);

  const momLabel = momChangePct != null
    ? `${momChangePct >= 0 ? "+" : ""}${momChangePct}% vs last month`
    : "No prior month data";

  return (
    <AnimatedCard index={index}>
      <Card className="transition-all hover:shadow-md">
        <CardContent className="px-5 py-4 space-y-3">
          <div className="flex justify-between cursor-pointer" onClick={() => setExpanded((v) => !v)}>
            <div>
              <CardHeaderBlock color="green" icon={TrendingUp} label="Sales" summary={`${displayEntries ?? "—"} entries · ${displayMonthLabel}`} />
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {isCurrentMonth && (
                  <>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-500/10">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      <span className="text-[10px] font-medium text-green-700 dark:text-green-400">Export</span>
                      <span className="text-[10px] font-bold text-green-700 dark:text-green-400">{displayExport}</span>
                    </div>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      <span className="text-[10px] font-medium text-blue-700 dark:text-blue-400">Local</span>
                      <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400">{displayLocal}</span>
                    </div>
                    <span className={`text-[10px] font-medium ${momChangePct == null ? "text-muted-foreground" : momChangePct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                      {momLabel}
                    </span>
                  </>
                )}
                {isHistorical && <HistoricalBadge label={displayMonthLabel} />}
                {displayKg != null && displayKg > 0 && (
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">· {fmt(displayKg)} kg</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{displayUsd != null ? fmtUSD(displayUsd) : "—"}</p>
              <p className="text-xs text-muted-foreground">total sales</p>
              <CardTimestamp timeLabel={timeLabel} dateLabel={dateLabel} />
            </div>
          </div>

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div key="sales-expanded" variants={expandVariants} initial="collapsed" animate="expanded" exit="collapsed" transition={{ duration: 0.22, ease: "easeInOut" }} className="overflow-hidden">
                <div className="pt-3 border-t border-border/50 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total (USD)</p>
                      <p className="text-sm font-semibold">{displayUsd != null ? fmtUSD(displayUsd) : "—"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Volume</p>
                      <p className="text-sm font-semibold">{displayKg != null ? `${fmt(displayKg)} kg` : "—"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Entries</p>
                      <p className="text-sm font-semibold">{displayEntries ?? "—"}</p>
                    </div>
                  </div>
                  {isCurrentMonth && (
                    <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/30">
                      <div className="space-y-1">
                        <p className="text-[10px] text-green-600 dark:text-green-400 uppercase tracking-wide font-medium">Export</p>
                        <p className="text-sm font-semibold">{displayExport} entries</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-wide font-medium">Local</p>
                        <p className="text-sm font-semibold">{displayLocal} entries</p>
                      </div>
                    </div>
                  )}
                  {isHistorical && !histEntry && (
                    <p className="text-[10px] text-muted-foreground italic">No sales data for {displayMonthLabel}.</p>
                  )}
                  {isCurrentMonth && (
                    <div className="flex justify-between items-center pt-1 border-t border-border/30">
                      <span className="text-[10px] text-muted-foreground">
                        Last Month ({(() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return fmtMonthLabel(toMonthKey(d.toLocaleDateString("en-CA"))); })()})
                      </span>
                      <span className="text-xs font-medium">{fmtUSD(lastMonth.total_usd)}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <ExpandRow id="sales" expanded={expanded} onToggle={() => setExpanded((v) => !v)} onSignIn={onSignIn} />
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAINTENANCE CARD
───────────────────────────────────────────────────────────────────────────── */

function MaintenanceCard({
  index, checkedToday, totalUnits, completion, statusBreakdown,
  timeLabel, dateLabel, onSignIn,
}: {
  index: number;
  checkedToday: number;
  totalUnits: number;
  completion: number;
  statusBreakdown: Record<string, number> | undefined;
  timeLabel: string;
  dateLabel: string;
  onSignIn: () => void;
}) {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <AnimatedCard index={index}>
      <Card className="transition-all hover:shadow-md">
        <CardContent className="px-5 py-4 space-y-3">
          <div className="flex justify-between cursor-pointer" onClick={() => setExpanded((v) => !v)}>
            <CardHeaderBlock color="red" icon={Wrench} label="Maintenance" summary={`${completion}% completion today`} />
            <div className="text-right">
              <p className="text-2xl font-bold">{checkedToday}/{totalUnits}</p>
              <p className="text-xs text-muted-foreground">units checked today</p>
              <CardTimestamp timeLabel={timeLabel} dateLabel={dateLabel} />
            </div>
          </div>
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div key="maintenance-expanded" variants={expandVariants} initial="collapsed" animate="expanded" exit="collapsed" transition={{ duration: 0.22, ease: "easeInOut" }} className="overflow-hidden">
                <div className="pt-3 border-t border-border/50 space-y-2">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Unit status</p>
                  <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div className="h-full bg-emerald-500 rounded-full" initial={{ width: 0 }} animate={{ width: `${completion}%` }} transition={{ duration: 0.5, ease: "easeOut" }} />
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
          <ExpandRow id="maintenance" expanded={expanded} onToggle={() => setExpanded((v) => !v)} onSignIn={onSignIn} />
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ENERGY CARD
───────────────────────────────────────────────────────────────────────────── */

function EnergyCard({
  index, currentMonth, previousMonth, momChangePct, ytdTotal,
  timeLabel, dateLabel, selectedMonthKey, monthlyTrends, onSignIn,
}: {
  index: number;
  currentMonth: { month: string; total_billed: number; total_kw: number; account2_billed: number; account3_billed: number; has_data: boolean };
  previousMonth: { month: string; total_billed: number; has_data: boolean };
  momChangePct: number | null;
  ytdTotal: number;
  timeLabel: string;
  dateLabel: string;
  selectedMonthKey: string;
  monthlyTrends: Array<{ month: string; total_billed: number; total_kw: number; total_demand: number }>;
  onSignIn: () => void;
}) {
  const [expanded, setExpanded] = React.useState(false);

  const isCurrentMonth  = selectedMonthKey === currentMonth.month;
  const isPreviousMonth = selectedMonthKey === previousMonth.month;

  const trendEntry = React.useMemo(
    () => monthlyTrends.find((t) => t.month === selectedMonthKey),
    [monthlyTrends, selectedMonthKey],
  );

  const displayLabel   = fmtMonthLabel(selectedMonthKey);
  const isHistorical   = !isCurrentMonth;

  const displayBilled = isCurrentMonth
    ? (currentMonth.has_data ? currentMonth.total_billed : null)
    : isPreviousMonth
      ? (previousMonth.has_data ? previousMonth.total_billed : null)
      : trendEntry?.total_billed ?? null;

  const displayKw = isCurrentMonth
    ? (currentMonth.has_data ? currentMonth.total_kw : null)
    : trendEntry?.total_kw ?? null;

  const momLabel = momChangePct != null
    ? `${momChangePct >= 0 ? "+" : ""}${momChangePct}% vs last month`
    : "No prior month data";

  return (
    <AnimatedCard index={index}>
      <Card className="transition-all hover:shadow-md">
        <CardContent className="px-5 py-4 space-y-3">
          <div className="flex justify-between cursor-pointer" onClick={() => setExpanded((v) => !v)}>
            <CardHeaderBlock color="amber" icon={Zap} label="Energy" summary={`${displayLabel} · YTD ${fmtPHP(ytdTotal)}`} />
            <div className="text-right">
              <p className="text-2xl font-bold">{displayBilled != null ? fmtPHP(displayBilled) : "—"}</p>
              <p className="text-xs text-muted-foreground">total billed</p>
              {isHistorical && <div className="flex justify-end mt-1"><HistoricalBadge label={displayLabel} /></div>}
              <CardTimestamp timeLabel={timeLabel} dateLabel={dateLabel} />
            </div>
          </div>
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div key="energy-expanded" variants={expandVariants} initial="collapsed" animate="expanded" exit="collapsed" transition={{ duration: 0.22, ease: "easeInOut" }} className="overflow-hidden">
                <div className="pt-3 border-t border-border/50 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{displayLabel}</span>
                    {isCurrentMonth && (
                      <span className={`text-[10px] font-medium ${momChangePct == null ? "text-muted-foreground" : momChangePct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {momLabel}
                      </span>
                    )}
                  </div>
                  {isCurrentMonth && currentMonth.has_data ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground">Account 2</p>
                        <p className="text-sm font-semibold">{fmtPHP(currentMonth.account2_billed)}</p>
                        {displayKw != null && <p className="text-[10px] text-muted-foreground">{fmt(displayKw)} kWh</p>}
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground">Account 3</p>
                        <p className="text-sm font-semibold">{fmtPHP(currentMonth.account3_billed)}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground">Total Billed</p>
                        <p className="text-sm font-semibold">{displayBilled != null ? fmtPHP(displayBilled) : "—"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground">kWh</p>
                        <p className="text-sm font-semibold">{displayKw != null ? fmt(displayKw) : "—"}</p>
                      </div>
                    </div>
                  )}
                  {isCurrentMonth && previousMonth.has_data && (
                    <div className="flex justify-between items-center pt-1 border-t border-border/30">
                      <span className="text-[10px] text-muted-foreground">Previous Month ({fmtMonthLabel(previousMonth.month)})</span>
                      <span className="text-xs font-medium">{fmtPHP(previousMonth.total_billed)}</span>
                    </div>
                  )}
                  {displayBilled == null && (
                    <p className="text-[10px] text-muted-foreground italic">No energy data for {displayLabel}.</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <ExpandRow id="energy" expanded={expanded} onToggle={() => setExpanded((v) => !v)} onSignIn={onSignIn} />
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */

export function LandingDashboard() {
  const [time, setTime]               = React.useState(() => new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date>(() => new Date());

  const selectedISO    = dateToISO(selectedDate);
  const selectedMthKey = toMonthKey(selectedISO);
  const isToday        = selectedISO === getTodayISO();

  const [stats, setStats]             = React.useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = React.useState(true);
  const cache = React.useRef<Record<string, DashboardStats>>({});

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

  React.useEffect(() => { fetchForDate(getTodayISO()); }, []);

  function handleDateSelect(d: Date | undefined) {
    if (!d) return;
    setSelectedDate(d);
    fetchForDate(dateToISO(d));
  }

  function handleSignIn(label: string) {
    toast(`${label} — Sign in required`, {
      description: "Sign in to view detailed reports and insights.",
      icon: <Lock className="h-4 w-4" />,
    });
  }

  const production  = stats?.production;
  const maintenance = stats?.maintenance;
  const sales       = stats?.sales;
  const energy      = stats?.energy;
  const qc          = stats?.qc;

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
          <p className="text-sm font-semibold">{production?.today_production_output ? fmt(production.today_production_output) : "—"}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Yesterday</p>
          <p className="text-sm font-semibold">{production?.yesterday_production_output ? fmt(production.yesterday_production_output) : "—"}</p>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground">6 product lines running</p>
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
              timeLabel={production?.last_updated_at ? relativeTime(new Date(production.last_updated_at)) : "—"}
              dateLabel={fmtDate(new Date(selectedISO + "T00:00:00"))}
              index={0}
              expandedContent={productionExpanded}
              onSignIn={() => handleSignIn("Production Output")}
            />

            <SalesCard
              index={1}
              thisMonth={sales?.this_month ?? { total_usd: 0, total_kg: 0, entry_count: 0, export_count: 0, local_count: 0 }}
              lastMonth={sales?.last_month  ?? { total_usd: 0, total_kg: 0, entry_count: 0 }}
              momChangePct={sales?.mom_change_pct ?? null}
              monthlyBreakdown={sales?.monthly_breakdown ?? []}
              timeLabel={sales?.last_updated_at ? relativeTime(new Date(sales.last_updated_at)) : "—"}
              dateLabel={sales?.last_updated_at ? fmtDate(new Date(sales.last_updated_at)) : "not available"}
              selectedMonthKey={selectedMthKey}
              onSignIn={() => handleSignIn("Sales")}
            />

            {/* LEFT STUBS with mock data */}
            <StubCard
              id="accounts" index={2} color="purple" label="Accounts" icon={Wallet}
              summary={MOCK.accounts.summary}
              stat={MOCK.accounts.stat}
              unit={MOCK.accounts.unit}
              timeLabel="Sample"
              expandedContent={<AccountsExpanded />}
              onSignIn={() => handleSignIn("Accounts")}
            />
            
            {/* QC CARD - Now using real API data */}
            <QcCard
              index={3}
              qcStats={qc}
              timeLabel={qc?.last_updated_at ? relativeTime(new Date(qc.last_updated_at)) : "—"}
              dateLabel={qc?.last_updated_at ? fmtDate(new Date(qc.last_updated_at)) : "not available"}
              selectedMonthKey={selectedMthKey}
              onSignIn={() => handleSignIn("Quality Control")}
            />
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-3 flex-1 min-w-0">
            <MaintenanceCard
              index={0}
              checkedToday={maintenance?.checked_today ?? 0}
              totalUnits={maintenance?.total_units ?? 0}
              completion={maintenance?.completion ?? 0}
              statusBreakdown={maintenance?.status_breakdown}
              timeLabel={maintenance?.last_updated_at ? relativeTime(new Date(maintenance.last_updated_at)) : "—"}
              dateLabel={maintenance?.last_updated_at ? fmtDate(new Date(maintenance.last_updated_at)) : "not available"}
              onSignIn={() => handleSignIn("Maintenance")}
            />

            <EnergyCard
              index={1}
              currentMonth={energy?.current_month ?? { month: currentMonthKey(), total_billed: 0, total_kw: 0, account2_billed: 0, account3_billed: 0, has_data: false }}
              previousMonth={energy?.previous_month ?? { month: "", total_billed: 0, has_data: false }}
              momChangePct={energy?.mom_change_pct ?? null}
              ytdTotal={energy?.ytd_summary?.total_billed_amount ?? 0}
              timeLabel={energy?.last_updated_at ? relativeTime(new Date(energy.last_updated_at)) : "—"}
              dateLabel={energy?.last_updated_at ? fmtDate(new Date(energy.last_updated_at)) : "not available"}
              selectedMonthKey={selectedMthKey}
              monthlyTrends={energy?.monthly_trends ?? []}
              onSignIn={() => handleSignIn("Energy")}
            />

            {/* RIGHT STUBS with mock data */}
            <StubCard
              id="procurement" index={2} color="amber" label="Procurement" icon={ShoppingCart}
              summary={MOCK.procurement.summary}
              stat={MOCK.procurement.stat}
              unit={MOCK.procurement.unit}
              timeLabel="Sample"
              expandedContent={<ProcurementExpanded />}
              onSignIn={() => handleSignIn("Procurement")}
            />
            <StubCard
              id="trading" index={3} color="blue" label="Trading" icon={ArrowLeftRight}
              summary={MOCK.trading.summary}
              stat={MOCK.trading.stat}
              unit={MOCK.trading.unit}
              timeLabel="Sample"
              expandedContent={<TradingExpanded />}
              onSignIn={() => handleSignIn("Trading")}
            />
            <StubCard
              id="workforce" index={4} color="pink" label="Workforce" icon={Users}
              summary={MOCK.workforce.summary}
              stat={MOCK.workforce.stat}
              unit={MOCK.workforce.unit}
              timeLabel="Sample"
              expandedContent={<WorkforceExpanded />}
              onSignIn={() => handleSignIn("Workforce")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}