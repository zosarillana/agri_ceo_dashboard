"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Factory,
  ShoppingCart,
  TrendingUp,
  Wallet,
  ArrowLeftRight,
  FlaskConical,
  Users,
  Wrench,
} from "lucide-react";

/* mock data */
import { mockData } from "../data/mock-data";

/* submodules */
import ProductionDash from "./-submodules/production";
import ProcurementDash from "./-submodules/procurement";
import SalesDash from "./-submodules/sales";
import AccountsDash from "./-submodules/accounts";
import TradingDash from "./-submodules/trading";
import QCDash from "./-submodules/qc";
import WorkforceDash from "./-submodules/workforce";
import MaintenanceDash from "./-submodules/maintenance";


/* ───────────────────────────────────────── */

type StatusLevel = "good" | "warn" | "bad";

interface GroupDef {
  id: string;
  label: string;
  icon: any;
  summary: string;
  stat: string;
  unit: string;
  status: StatusLevel;
}

function fmt(n: number) {
  return n.toLocaleString();
}

function fmtPHP(n: number) {
  return "₱" + n.toLocaleString();
}

function StatusIcon({ status }: { status: StatusLevel }) {
  if (status === "good") {
    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  }

  if (status === "warn") {
    return <Clock className="h-4 w-4 text-yellow-500" />;
  }

  return <AlertCircle className="h-4 w-4 text-red-500" />;
}

/* ───────────────────────────────────────── */
/* DATA GROUPS */
/* ───────────────────────────────────────── */

const groups: GroupDef[] = [
  {
    id: "production",
    label: "Production Output",
    icon: Factory,
    summary: "6 product lines running",
    stat: fmt(
      mockData.production.coconutWater +
        mockData.production.cwc +
        mockData.production.creamUHT
    ),
    unit: "units today",
    status: "good",
  },
  {
    id: "procurement",
    label: "Procurement",
    icon: ShoppingCart,
    summary: `${mockData.procurement.filter((x) => x.status === "delayed").length} delayed`,
    stat: `${mockData.procurement.filter((x) => x.status === "received").length}/${mockData.procurement.length}`,
    unit: "received",
    status: mockData.procurement.some((x) => x.status === "delayed")
      ? "warn"
      : "good",
  },
  {
    id: "sales",
    label: "Sales",
    icon: TrendingUp,
    summary: `${mockData.sales.length} product lines`,
    stat: fmtPHP(mockData.sales.reduce((a, b) => a + b.value, 0)),
    unit: "revenue",
    status: "good",
  },
  {
    id: "accounts",
    label: "Accounts",
    icon: Wallet,
    summary: "Net position",
    stat: fmtPHP(5618000),
    unit: "cashflow",
    status: "good",
  },
  {
    id: "trading",
    label: "Trading",
    icon: ArrowLeftRight,
    summary: `${mockData.trading.length} active lines`,
    stat: fmt(mockData.trading.reduce((s, x) => s + x.volumeIn, 0)),
    unit: "kg input",
    status: "good",
  },
  {
    id: "qc",
    label: "Quality Control",
    icon: FlaskConical,
    summary: `${mockData.qc.samplesTested} samples tested`,
    stat: `${mockData.qc.passRate}%`,
    unit: "pass rate",
    status: "good",
  },
  {
    id: "workforce",
    label: "Workforce",
    icon: Users,
    summary: `${mockData.workforce.presentToday}/${mockData.workforce.totalHeadcount} present`,
    stat: `${mockData.workforce.safetyIncidents}`,
    unit: "incidents",
    status:
      mockData.workforce.safetyIncidents === 0 ? "good" : "bad",
  },
  {
    id: "maintenance",
    label: "Maintenance",
    icon: Wrench,
    summary: `${mockData.maintenance.length} units`,
    stat: `${mockData.maintenance.filter((x) => x.status === "operational").length}/${mockData.maintenance.length}`,
    unit: "online",
    status: "warn",
  },
];

/* ───────────────────────────────────────── */

const subDashboards: Record<string, React.ReactNode> = {
  production: <ProductionDash />,
  procurement: <ProcurementDash />,
  sales: <SalesDash />,
  accounts: <AccountsDash />,
  trading: <TradingDash />,
  qc: <QCDash />,
  workforce: <WorkforceDash />,
  maintenance: <MaintenanceDash />,
};

/* ───────────────────────────────────────── */

export default function CEODashboard() {
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const activeMeta = groups.find((g) => g.id === activeGroup);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-center justify-between"
        >
          <div>
            {activeGroup && (
              <Button
                variant="ghost"
                size="sm"
                className="mb-2 -ml-2"
                onClick={() => setActiveGroup(null)}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Overview
              </Button>
            )}

            <h1 className="text-3xl font-bold tracking-tight">
              {activeMeta ? activeMeta.label : "CEO Daily Dashboard"}
            </h1>

            <p className="text-sm text-muted-foreground mt-1">
              {today}
            </p>
          </div>

          {activeGroup && (
            <Badge variant="outline">Sub-dashboard</Badge>
          )}
        </motion.div>

        <Separator />

        {/* MAIN CONTENT */}
        <AnimatePresence mode="wait">

          {/* OVERVIEW */}
          {!activeGroup && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.28 }}
              className="space-y-6"
            >
              {/* KPI */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    label: "Revenue",
                    value: fmtPHP(
                      mockData.sales.reduce((a, b) => a + b.value, 0)
                    ),
                  },
                  {
                    label: "QC Pass Rate",
                    value: mockData.qc.passRate + "%",
                  },
                  {
                    label: "Attendance",
                    value: `${mockData.workforce.presentToday}/${mockData.workforce.totalHeadcount}`,
                  },
                  {
                    label: "Incidents",
                    value:
                      mockData.workforce.safetyIncidents === 0
                        ? "None"
                        : mockData.workforce.safetyIncidents,
                  },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card>
                      <CardContent className="pt-4 pb-4">
                        <p className="text-xs text-muted-foreground">
                          {item.label}
                        </p>
                        <p className="text-xl font-semibold mt-1">
                          {item.value}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* MODULE CARDS */}
              <div className="grid md:grid-cols-2 gap-4">
                {groups.map((g, i) => {
                  const Icon = g.icon;

                  return (
                    <motion.div
                      key={g.id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      whileHover={{
                        y: -4,
                        scale: 1.01,
                      }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <Card
                        onClick={() => setActiveGroup(g.id)}
                        className="cursor-pointer border hover:border-primary transition-all"
                      >
                        <CardContent className="pt-5 pb-5">
                          <div className="flex justify-between gap-4">

                            <div className="flex gap-3">
                              <div className="rounded-xl bg-muted p-3 h-fit">
                                <Icon className="h-5 w-5" />
                              </div>

                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold">
                                    {g.label}
                                  </p>
                                  <StatusIcon status={g.status} />
                                </div>

                                <p className="text-sm text-muted-foreground mt-1">
                                  {g.summary}
                                </p>
                              </div>
                            </div>

                            <div className="text-right flex items-center gap-2">
                              <div>
                                <p className="font-semibold">
                                  {g.stat}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {g.unit}
                                </p>
                              </div>

                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>

                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* SUBMODULES */}
          {activeGroup && (
            <motion.div
              key="submodule"
              initial={{ opacity: 0, x: 25 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -25 }}
              transition={{ duration: 0.25 }}
            >
              <Tabs
                defaultValue={activeGroup}
                onValueChange={setActiveGroup}
              >
                <TabsList className="flex flex-wrap h-auto gap-1 mb-6">
                  {groups.map((g) => (
                    <TabsTrigger
                      key={g.id}
                      value={g.id}
                      className="text-xs"
                    >
                      {g.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {groups.map((g) => (
                  <TabsContent key={g.id} value={g.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {subDashboards[g.id]}
                    </motion.div>
                  </TabsContent>
                ))}
              </Tabs>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}