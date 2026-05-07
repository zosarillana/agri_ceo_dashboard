import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useLocation } from "@tanstack/react-router";

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
} from "lucide-react";

import { mockData } from "../data/-mock-data";

/* ───────────────────────────────────────── */

function fmt(n: number) {
  return n.toLocaleString();
}

function fmtPHP(n: number) {
  return "₱" + n.toLocaleString();
}

function relativeTime(date: Date): { label: string; fresh: boolean } {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return { label: "Just now", fresh: true };
  if (diffMins < 60) return { label: `${diffMins}m ago`, fresh: true };
  if (diffHours < 24) return { label: `${diffHours}h ago`, fresh: true };
  if (diffDays === 1) return { label: "Yesterday", fresh: false };
  return { label: `${diffDays} days ago`, fresh: false };
}

const now = new Date();
const minsAgo = (m: number) => new Date(now.getTime() - m * 60000);
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000);
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);

/* ───────────────────────────────────────── */

const groups = [
  {
    id: "production",
    label: "Production Output",
    icon: Factory,
    summary: "6 product lines running",
    stat: fmt(
      mockData.production.coconutWater.actual +
        mockData.production.cwc.actual +
        mockData.production.creamUHT.actual,
    ),
    unit: "units today",
    updatedAt: minsAgo(3),
  },
  {
    id: "procurement",
    label: "Procurement",
    icon: ShoppingCart,
    summary: "Supply chain status",
    stat: `${mockData.procurement.length * 47}`,
    unit: "orders this month",
    updatedAt: minsAgo(18),
  },
  {
    id: "sales",
    label: "Sales",
    icon: TrendingUp,
    summary: `${mockData.sales.length} product lines`,
    stat: fmtPHP(mockData.sales.reduce((a, b) => a + b.value, 0) * 12),
    unit: "revenue this month",
    updatedAt: hoursAgo(1),
  },
  {
    id: "accounts",
    label: "Accounts",
    icon: Wallet,
    summary: "Net position",
    stat: fmtPHP(5618000 * 8),
    unit: "total cashflow",
    updatedAt: hoursAgo(4),
  },
  {
    id: "trading",
    label: "Trading",
    icon: ArrowLeftRight,
    summary: "Active trades",
    stat: fmt(mockData.trading.length * 340),
    unit: "units traded today",
    updatedAt: minsAgo(7),
  },
  {
    id: "qc",
    label: "Quality Control",
    icon: FlaskConical,
    summary: "QC status",
    stat: `${mockData.qc.passRate}%`,
    unit: `${fmt(mockData.qc.samplesTested * 24)} samples tested`,
    updatedAt: daysAgo(1),
  },
  {
    id: "workforce",
    label: "Workforce",
    icon: Users,
    summary: "Attendance tracking",
    stat: `${mockData.workforce.presentToday * 3}`,
    unit: "employees across all sites",
    updatedAt: hoursAgo(2),
  },
  {
    id: "maintenance",
    label: "Maintenance",
    icon: Wrench,
    summary: "Equipment status",
    stat: `${mockData.maintenance.length * 14}`,
    unit: "units monitored",
    updatedAt: daysAgo(3),
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
  },
];

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

/* ───────────────────────────────────────── */

export default function CEODashboard() {
  const location = useLocation();
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const isActive = (id: string) =>
    location.pathname === `/auth/admin/dashboard/${id}`;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto py-0 space-y-5">
        {/* Last updated */}
        <div className="flex items-center justify-end gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">
            Live dashboard —{" "}
            <span className="font-medium text-foreground">
              {time.toLocaleTimeString("en-PH", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          </span>
        </div>

        {/* MODULE GRID */}
        <div className="grid md:grid-cols-2 gap-3">
          {groups.map((g, i) => {
            const Icon = g.icon;
            const active = isActive(g.id);
            const { label: timeLabel, fresh } = relativeTime(g.updatedAt);

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

                        {/* Right — stat + freshness */}
                        <div className="text-right shrink-0">
                          <p className="text-2xl font-bold tracking-tight leading-tight">
                            {g.stat}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {g.unit}
                          </p>
                          <span
                            className={`inline-flex items-center gap-1 mt-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
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
