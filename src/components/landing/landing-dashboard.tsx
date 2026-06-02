"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { dashboardService } from "@/services/dashboard.service";
import type { DashboardStats } from "@/types/dashboard.types";
import { getTodayISO, toISO, toMonthKey, fmtDate, relativeTime, currentMonthKey } from "@/lib/dashboard-utils";

// Import your existing card components
import { ProductionCard } from "@/routes/auth/-components/-dashboard-tiles/production-card";
import { SalesCard } from "@/routes/auth/-components/-dashboard-tiles/sales-card";
import { QcCard } from "@/routes/auth/-components/-dashboard-tiles/qc-card";
import { MaintenanceCard } from "@/routes/auth/-components/-dashboard-tiles/maintenance-card";
import { EnergyCard } from "@/routes/auth/-components/-dashboard-tiles/energy-card";
import { WorkforceCard } from "@/routes/auth/-components/-dashboard-tiles/workforce-card";
import { AccountsStubCard, ProcurementStubCard, TradingStubCard } from "@/routes/auth/-components/-dashboard-tiles/stub-tiles";

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */

export function LandingDashboard() {
  const [time, setTime] = React.useState(() => new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date>(() => new Date());
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = React.useState(true);
  const cache = React.useRef<Record<string, DashboardStats>>({});

  const selectedISO = toISO(selectedDate);
  const selectedMthKey = toMonthKey(selectedISO);
  const isToday = selectedISO === getTodayISO();

  // Real-time clock
  React.useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Fetch data for selected date
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

  // Initial load
  React.useEffect(() => {
    fetchForDate(getTodayISO());
  }, []);

  function handleDateSelect(d: Date | undefined) {
    if (!d) return;
    setSelectedDate(d);
    fetchForDate(toISO(d));
  }

  // Extract data from stats
  const production = stats?.production;
  const maintenance = stats?.maintenance;
  const sales = stats?.sales;
  const energy = stats?.energy;
  const workforce = stats?.workforce;
  const qc = stats?.qc;

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
            {/* Production Card */}
            <ProductionCard
              active={false}
              production={production}
              loading={loadingStats}
              isToday={isToday}
              selectedISO={selectedISO}
            />

            {/* Sales Card */}
            <SalesCard
              active={false}
              index={1}
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

            {/* Accounts Stub Card */}
            <AccountsStubCard
              active={false}
              index={2}
            />

            {/* QC Card */}
            <QcCard
              active={false}
              index={3}
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
            {/* Maintenance Card */}
            <MaintenanceCard
              active={false}
              index={0}
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

            {/* Energy Card */}
            <EnergyCard
              active={false}
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

            {/* Procurement Stub Card */}
            <ProcurementStubCard
              active={false}
              index={2}
            />

            {/* Trading Stub Card */}
            <TradingStubCard
              active={false}
              index={3}
            />

            {/* Workforce Card */}
            <WorkforceCard
              active={false}
              index={4}
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