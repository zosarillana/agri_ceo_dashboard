import * as React from "react";
import { format } from "date-fns";
import { useLocation } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";

import { useDashboardStore } from "@/store/dashboard.store";
import type { DashboardStats } from "@/types/dashboard.types";
import {
  toMonthKey,
  getTodayISO,
  toISO,
  fmtDate,
  relativeTime,
  currentMonthKey,
} from "@/lib/dashboard-utils";
import { ProductionCard } from "./-dashboard-tiles/production-card";
import { QcCard } from "./-dashboard-tiles/qc-card";
import { WorkforceCard } from "./-dashboard-tiles/workforce-card";
import { SalesCard } from "./-dashboard-tiles/sales-card";
import { EnergyCard } from "./-dashboard-tiles/energy-card";
import { MaintenanceCard } from "./-dashboard-tiles/maintenance-card";
import { AccountsCard } from "./-dashboard-tiles/accounts-card";
import { ProcurementCard } from "./-dashboard-tiles/procurement-card";
import { TradesCard } from "./-dashboard-tiles/trades-card";
import useRealtimeListener from "@/hooks/useRealTimeListener";
import { toast } from "sonner";

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */

interface CEODashboardProps {
  initialStats?: DashboardStats;
}

export default function CEODashboard({ initialStats }: CEODashboardProps) {
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

  const {
    stats,
    loading: loadingStats,
    fetchStats,
    setStats,
  } = useDashboardStore();
  const production = stats?.production;
  const maintenance = stats?.maintenance;
  const sales = stats?.sales;
  const energy = stats?.energy;
  const workforce = stats?.workforce;
  const qc = stats?.qc;

  const procurement = stats?.procurement;
  const accounts = stats?.accounts;

  // Hydrate store with loader data — skips the initial network call
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    if (initialStats) {
      setStats(initialStats);
    } else {
      fetchStats();
    }
  }, []);

  // Clock tick — isolated to its own state so it never affects fetchStats
  React.useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  function handleDateSelect(d: Date | undefined) {
    if (!d) return;
    setSelectedDate(d);
    fetchStats(toISO(d));
  }

  useRealtimeListener(
    "realtime",
    ".realtime.event",
    React.useCallback(
      (message) => {
        console.log("Realtime message received:", message);
        fetchStats(getTodayISO(), true); // ← Add 'true' to force refresh
        toast("Dashboard updated", {
          description: "New data just came in — refreshing now.",
        });
      },
      [fetchStats],
    ),
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
            <ProductionCard
              production={production}
              loading={loadingStats}
              isToday={isToday}
              selectedISO={selectedISO}
              active={isActive("production")}
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

            <AccountsCard
              active={isActive("accounts")}
              index={4}
              accounts={accounts}
              timeLabel={
                sales?.last_updated_at
                  ? relativeTime(new Date(sales.last_updated_at))
                  : "—"
              }
              dateLabel={
                sales?.last_updated_at
                  ? fmtDate(new Date(sales.last_updated_at))
                  : "—"
              }
            />

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
                  : "—"
              }
            />

            <EnergyCard
              active={isActive("energy")}
              index={2}
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
                  : "—"
              }
              selectedMonthKey={selectedMthKey}
              monthlyTrends={energy?.monthly_trends ?? []}
            />

            <ProcurementCard
              active={isActive("procurement")}
              index={3}
              procurement={procurement}
              timeLabel={
                maintenance?.last_updated_at
                  ? relativeTime(new Date(maintenance.last_updated_at))
                  : "—"
              }
              dateLabel={
                maintenance?.last_updated_at
                  ? fmtDate(new Date(maintenance.last_updated_at))
                  : "—"
              }
            />

            {/* Mock Trades */}
            <TradesCard
              active={isActive("trading")}
              index={4}
              timeLabel={
                sales?.last_updated_at
                  ? relativeTime(new Date(sales.last_updated_at))
                  : "—"
              }
              dateLabel={
                sales?.last_updated_at
                  ? fmtDate(new Date(sales.last_updated_at))
                  : "—"
              }
            />

            <WorkforceCard
              active={isActive("workforce")}
              index={5}
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
