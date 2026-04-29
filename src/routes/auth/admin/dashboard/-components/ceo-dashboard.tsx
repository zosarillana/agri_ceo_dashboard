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
} from "lucide-react";

import { mockData } from "../data/mock-data";

/* ───────────────────────────────────────── */

function fmt(n: number) {
  return n.toLocaleString();
}

function fmtPHP(n: number) {
  return "₱" + n.toLocaleString();
}

/* ───────────────────────────────────────── */

const groups = [
  {
    id: "production",
    label: "Production Output",
    icon: Factory,
    summary: "6 product lines running",
    stat: fmt(
      mockData.production.coconutWater +
        mockData.production.cwc +
        mockData.production.creamUHT,
    ),
    unit: "units today",
  },
  {
    id: "procurement",
    label: "Procurement",
    icon: ShoppingCart,
    summary: "Supply chain status",
    stat: `${mockData.procurement.length}`,
    unit: "orders",
  },
  {
    id: "sales",
    label: "Sales",
    icon: TrendingUp,
    summary: `${mockData.sales.length} product lines`,
    stat: fmtPHP(mockData.sales.reduce((a, b) => a + b.value, 0)),
    unit: "revenue",
  },
  {
    id: "accounts",
    label: "Accounts",
    icon: Wallet,
    summary: "Net position",
    stat: fmtPHP(5618000),
    unit: "cashflow",
  },
  {
    id: "trading",
    label: "Trading",
    icon: ArrowLeftRight,
    summary: "Active trades",
    stat: fmt(mockData.trading.length),
    unit: "lines",
  },
  {
    id: "qc",
    label: "Quality Control",
    icon: FlaskConical,
    summary: "QC status",
    stat: `${mockData.qc.passRate}%`,
    unit: "pass rate",
  },
  {
    id: "workforce",
    label: "Workforce",
    icon: Users,
    summary: "Attendance tracking",
    stat: `${mockData.workforce.presentToday}`,
    unit: "present",
  },
  {
    id: "maintenance",
    label: "Maintenance",
    icon: Wrench,
    summary: "Equipment status",
    stat: `${mockData.maintenance.length}`,
    unit: "units",
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
  | "maintenance";

type DashboardRoute = `/auth/admin/dashboard/${DashboardSegment}`;

/* ───────────────────────────────────────── */

export default function CEODashboard() {
  const location = useLocation();

  const isActive = (id: string) =>
    location.pathname === `/auth/admin/dashboard/${id}`;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-0 space-y-6">

        {/* MODULE GRID */}
        <div className="grid md:grid-cols-2 gap-4">
          {groups.map((g, i) => {
            const Icon = g.icon;

            return (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ y: -4, scale: 1.01 }}
              >
                <Link
                  to={`/auth/admin/dashboard/${g.id}` as DashboardRoute}
                  className="block"
                >
                  <Card
                    className={`cursor-pointer transition-all border hover:border-primary ${
                      isActive(g.id) ? "border-primary" : ""
                    }`}
                  >
                    <CardContent className="pt-5 pb-5">
                      <div className="flex justify-between">
                        <div className="flex gap-3">
                          <div className="rounded-xl bg-muted p-3">
                            <Icon className="h-5 w-5" />
                          </div>

                          <div>
                            <p className="font-semibold">{g.label}</p>
                            <p className="text-sm text-muted-foreground">
                              {g.summary}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-semibold">{g.stat}</p>
                          <p className="text-xs text-muted-foreground">
                            {g.unit}
                          </p>
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
