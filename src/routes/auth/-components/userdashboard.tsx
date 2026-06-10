import * as React from "react";
import { format } from "date-fns";
import { useLocation } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";

import { useAuthStore } from "@/store/auth.store";
import { useDashboardStore } from "@/store/dashboard.store";
import {
  toMonthKey,
  toISO,
  getTodayISO,
  fmtDate,
  relativeTime,
  currentMonthKey,
} from "@/lib/dashboard-utils";
import useRealtimeListener from "@/hooks/useRealTimeListener";

import { SalesCard } from "./-dashboard-tiles/sales-card";
import { EnergyCard } from "./-dashboard-tiles/energy-card";
import { MaintenanceCard } from "./-dashboard-tiles/maintenance-card";
import { ProductionCard } from "./-dashboard-tiles/production-card";
import { QcCard } from "./-dashboard-tiles/qc-card";
import { WorkforceCard } from "./-dashboard-tiles/workforce-card";
import { AccountsCard } from "./-dashboard-tiles/accounts-card";
import { ProcurementCard } from "./-dashboard-tiles/procurement-card";
import { TradesCard } from "./-dashboard-tiles/trades-card";

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

const DEPARTMENT_TILES: Record<string, DashboardSegment[]> = {
  sales: ["sales"],
  production: ["production"],
  maintenance: ["maintenance"],
  energy: ["energy"],
  qc: ["qc"],
  "quality control": ["qc"],
  procurement: ["procurement"],
  workforce: ["workforce"],
  trading: ["trading"],
  accounts: ["accounts"],
};

function getAllowedTiles(
  departments: { id: number; name: string }[] | null | undefined,
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

export default function UserDashboard() {
  const { user } = useAuthStore();
  const location = useLocation();

  const departments = user?.departments ?? [];
  const allowedTiles: DashboardSegment[] = getAllowedTiles(departments);

  const isActive = (id: string) =>
    location.pathname === `/auth/user/dashboard/${id}`;

  const [time, setTime] = React.useState(() => new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date>(
    () => new Date(),
  );

  const selectedISO = toISO(selectedDate);
  const selectedMthKey = toMonthKey(selectedISO);
  const isToday = selectedISO === getTodayISO();

  React.useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const { stats, loading: loadingStats, fetchStats } = useDashboardStore();

  const production  = stats?.production;
  const maintenance = stats?.maintenance;
  const sales       = stats?.sales;
  const energy      = stats?.energy;
  const workforce   = stats?.workforce;
  const qc          = stats?.qc;
  const procurement = stats?.procurement;
  const accounts    = stats?.accounts;

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Realtime refresh
  useRealtimeListener(
    "realtime",
    ".realtime.event",
    React.useCallback(() => {
      fetchStats(getTodayISO());
      toast("Dashboard updated", {
        description: "New data just came in — refreshing now.",
      });
    }, [fetchStats])
  );

  function handleDateSelect(d: Date | undefined) {
    if (!d) return;
    setSelectedDate(d);
    fetchStats(toISO(d));
  }

  /* ── No tiles fallback ─────────────────────────────────────────────────── */
  if (allowedTiles.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-foreground">
            No dashboard available
          </p>
          <p className="text-xs text-muted-foreground">
            {departments.length === 0 ? (
              "You have no departments assigned."
            ) : (
              <>
                Your department{departments.length > 1 ? "s" : ""} (
                <span className="font-mono">
                  {departments.map((d) => d.name).join(", ")}
                </span>
                ) have no assigned tiles.
              </>
            )}{" "}
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
              <span className="text-xs text-muted-foreground italic">
                None assigned
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
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
        </div>

        {/* TILES */}
        <div className="flex flex-col gap-3">
          {allowedTiles.includes("production") && (
            <ProductionCard
              production={production}
              loading={loadingStats}
              isToday={isToday}
              selectedISO={selectedISO}
              active={isActive("production")}
              basePath="/auth/user/dashboard"
            />
          )}

          {allowedTiles.includes("sales") && (
            <SalesCard
              active={isActive("sales")}
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
              basePath="/auth/user/dashboard"
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
              basePath="/auth/user/dashboard"
            />
          )}

          {allowedTiles.includes("energy") && (
            <EnergyCard
              active={isActive("energy")}
              index={3}
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
              basePath="/auth/user/dashboard"
            />
          )}

          {allowedTiles.includes("qc") && (
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
              basePath="/auth/user/dashboard"
            />
          )}

          {allowedTiles.includes("workforce") && (
            <WorkforceCard
              active={isActive("workforce")}
              index={6}
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
              basePath="/auth/user/dashboard"
            />
          )}

          {allowedTiles.includes("accounts") && (
            <AccountsCard
              active={isActive("accounts")}
              index={7}
              accounts={accounts}
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
              basePath="/auth/user/dashboard"
            />
          )}

          {allowedTiles.includes("procurement") && (
            <ProcurementCard
              active={isActive("procurement")}
              index={8}
              procurement={procurement}
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
              basePath="/auth/user/dashboard"
            />
          )}

          {allowedTiles.includes("trading") && (
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
          )}
        </div>
      </div>
    </div>
  );
}