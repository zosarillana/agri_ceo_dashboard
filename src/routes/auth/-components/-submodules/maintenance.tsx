"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { BarChart, Calendar as CalendarIcon, Clipboard, Clock } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  Activity,
  Factory,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { usePlantStore } from "@/store/plant.store";
import { logService } from "@/services/maintenance.service";

import type {
  MaintenanceUnit,
  SubUnit,
  MaintenanceStatus,
  Plant,
  MaintenanceLog,
  MaintenanceLogByPlant,
} from "@/types/maintenance.types";
import MaintenanceLogForm from "../-forms/maintenance-log-form";

import { useCanSubmitMaintenanceCheck } from "@/hooks/use-can-submit-maintenance-check";

type ViewMode = "view" | "logs";

// ─────────────────────────────────────────────────────────────
// BADGES
// ─────────────────────────────────────────────────────────────

function statusBadge(status: MaintenanceStatus) {
  const variants = {
    operational:
      "bg-emerald-500/15 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20",
    maintenance:
      "bg-amber-500/15 text-amber-600 border-amber-500/20 hover:bg-amber-500/20",
    down: "bg-rose-500/15 text-rose-600 border-rose-500/20 hover:bg-rose-500/20",
    standby: "border",
  };

  const labels = {
    operational: "Operational",
    maintenance: "Maintenance",
    down: "Down",
    standby: "Standby",
  };

  return (
    <Badge className={cn("transition-colors border", variants[status])}>
      <span
        className={cn("mr-1.5 h-1.5 w-1.5 rounded-full inline-block", {
          "bg-emerald-500 animate-pulse": status === "operational",
          "bg-amber-500":                 status === "maintenance",
          "bg-rose-500":                  status === "down",
          "bg-muted-foreground":          status === "standby",
        })}
      />
      {labels[status]}
    </Badge>
  );
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function formatDate(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleString();
}

function formatDateTime(date: Date | undefined) {
  if (!date) return "";
  return format(date, "yyyy-MM-dd HH:mm:ss");
}

// ─────────────────────────────────────────────────────────────
// DATE TIME PICKER
// ─────────────────────────────────────────────────────────────

function DateTimePicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (date: string) => void;
  disabled?: boolean;
}) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined,
  );
  const [selectedTime, setSelectedTime] = React.useState<string>(
    value ? format(new Date(value), "HH:mm") : "09:00",
  );

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date && selectedTime) {
      const [hours, minutes] = selectedTime.split(":");
      const dateTime = new Date(date);
      dateTime.setHours(parseInt(hours), parseInt(minutes));
      onChange(formatDateTime(dateTime));
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value;
    setSelectedTime(time);
    if (selectedDate && time) {
      const [hours, minutes] = time.split(":");
      const dateTime = new Date(selectedDate);
      dateTime.setHours(parseInt(hours), parseInt(minutes));
      onChange(formatDateTime(dateTime));
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Next Schedule</Label>
      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              disabled={disabled}
              className={cn(
                "w-1/2 justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
              disabled={(date) => date < new Date()}
            />
          </PopoverContent>
        </Popover>

        <div className="relative w-full">
          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="time"
            value={selectedTime}
            onChange={handleTimeChange}
            disabled={disabled}
            className="w-fulle pl-9"
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LOG INPUT — shared by both UnitCard and SubUnitCard
// ─────────────────────────────────────────────────────────────

function LogInput({
  unitId,
  unitName,
  onSubmit,
}: {
  unitId: number;
  unitName: string;
  onSubmit: (log: MaintenanceLog) => void;
}) {
  const canSubmit = useCanSubmitMaintenanceCheck();

  const [status, setStatus] = React.useState<MaintenanceStatus>("operational");
  const [notes, setNotes] = React.useState("");
  const [nextScheduled, setNextScheduled] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  async function handleSubmit() {
    if (!canSubmit) return; // second line of defense against stray calls
    setLoading(true);
    setSuccess(false);
    try {
      const newLog = await logService.submitCheck(unitId, {
        status,
        notes: notes || null,
        next_scheduled_at: nextScheduled || null,
        checked_at: new Date().toISOString(),
      });

      onSubmit(newLog);
      setNotes("");
      setNextScheduled("");
      setSuccess(true);

      setTimeout(() => {
        setIsExpanded(false);
        setTimeout(() => setSuccess(false), 1000);
      }, 1500);
    } catch (error) {
      console.error("Failed to submit check:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors flex justify-between items-center"
      >
        <span>
          {canSubmit ? "Submit Maintenance Check" : "Maintenance Check (view only)"}
        </span>
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform duration-200",
            isExpanded && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4 bg-background border-t">
              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-3 rounded-md"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Check submitted for {unitName}!
                  </span>
                </motion.div>
              ) : !canSubmit ? (
                <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 p-3 rounded-md text-sm">
                  <AlertCircle className="h-4 w-4" />
                  You don't have permission to submit maintenance checks.
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor={`status-${unitId}`} className="text-sm font-medium">
                      Status
                    </Label>
                    <Select
                      value={status}
                      onValueChange={(v) => setStatus(v as MaintenanceStatus)}
                      disabled={!canSubmit}
                    >
                      <SelectTrigger id={`status-${unitId}`} className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operational">Operational</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="down">Down</SelectItem>
                        <SelectItem value="standby">Standby</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`notes-${unitId}`} className="text-sm font-medium">
                      Notes
                    </Label>
                    <Textarea
                      id={`notes-${unitId}`}
                      placeholder="Add any maintenance notes..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="text-sm"
                      rows={2}
                      disabled={!canSubmit}
                    />
                  </div>

                  <DateTimePicker
                    value={nextScheduled}
                    onChange={setNextScheduled}
                    disabled={!canSubmit}
                  />

                  <Button
                    disabled={loading || !canSubmit}
                    onClick={handleSubmit}
                    className="w-full mt-2"
                    size="sm"
                  >
                    {loading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                    {loading ? "Saving..." : "Submit Check"}
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SUB UNIT CARD — expandable, supports LogInput
// ─────────────────────────────────────────────────────────────

function SubUnitCard({
  subunit,
  onRefresh,
  onLogSubmit,
}: {
  subunit: SubUnit;
  onRefresh: () => void;
  onLogSubmit: (log: MaintenanceLog) => void;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.2 }}
      className="border rounded-md bg-background"
    >
      {/* Sub-unit header row */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 transition-colors text-sm"
      >
        <div className="flex items-center gap-2">
          <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="font-medium">{subunit.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {statusBadge(subunit.status)}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
              isExpanded && "rotate-180",
            )}
          />
        </div>
      </button>

      {/* Expandable log input */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-2 border-t space-y-2">
              {/* Last checked / next scheduled */}
              {"last_checked_at" in subunit && (
                <div className="grid grid-cols-2 gap-3 text-xs mb-2">
                  <div>
                    <p className="text-muted-foreground">Last Checked</p>
                    <p>{formatDate((subunit as any).last_checked_at)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Next</p>
                    <p>{formatDate((subunit as any).next_scheduled_at)}</p>
                  </div>
                </div>
              )}

              <LogInput
                unitId={subunit.id}
                unitName={subunit.name}
                onSubmit={(log) => {
                  onLogSubmit(log);
                  onRefresh();
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// UNIT CARD
// ─────────────────────────────────────────────────────────────

function UnitCard({
  unit,
  onRefresh,
  onLogSubmit,
}: {
  unit: MaintenanceUnit;
  onRefresh: () => void;
  onLogSubmit: (log: MaintenanceLog) => void;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const hasSubUnits = (unit.subunits ?? []).length > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="border rounded-lg bg-muted/30 hover:bg-muted/40 transition-colors"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 text-left"
      >
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium">{unit.name}</p>
              {/* Sub-unit count pill */}
              {hasSubUnits && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border">
                  {unit.subunits!.length} sub-units
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground line-clamp-1">
              {unit.notes ?? "No notes"}
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground">Last Checked</p>
                <p>{formatDate(unit.last_checked_at)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Next</p>
                <p>{formatDate(unit.next_scheduled_at)}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-3 shrink-0">
            {statusBadge(unit.status)}
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200 text-muted-foreground",
                isExpanded && "rotate-180",
              )}
            />
          </div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t pt-3">
              {/* Log input for the top-level unit itself */}
              <LogInput
                unitId={unit.id}
                unitName={unit.name}
                onSubmit={(log) => {
                  onLogSubmit(log);
                  onRefresh();
                }}
              />

              {/* Sub-units — each is now a full interactive SubUnitCard */}
              {hasSubUnits && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Sub-units
                  </p>
                  <AnimatePresence>
                    {unit.subunits!.map((su) => (
                      <SubUnitCard
                        key={su.id}
                        subunit={su}
                        onRefresh={onRefresh}
                        onLogSubmit={onLogSubmit}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// LOG ITEM
// ─────────────────────────────────────────────────────────────

const LogItem = React.memo(
  ({ log, isNew }: { log: MaintenanceLog; isNew?: boolean }) => (
    <motion.div
      initial={
        isNew
          ? { opacity: 0, scale: 0.95, backgroundColor: "#f0fdf4" }
          : { opacity: 0, x: -20 }
      }
      animate={{ opacity: 1, x: 0, backgroundColor: "#ffffff" }}
      transition={{ duration: 0.3 }}
      className="flex justify-between items-center border rounded-md px-3 py-2 text-xs hover:bg-muted/50 transition-colors"
    >
      <div>
        <p className="font-medium">{log.unit_name || "Unknown Unit"}</p>
        <p className="text-muted-foreground">
          {log.checked_by?.name || "Unknown User"}
        </p>
      </div>
      <div className="text-right space-y-1">
        {statusBadge(log.status)}
        <p className="text-muted-foreground text-xs">
          {formatDate(log.checked_at)}
        </p>
      </div>
    </motion.div>
  ),
);

LogItem.displayName = "LogItem";

// ─────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────

function ViewSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────

export default function MaintenanceDash() {
  const [viewMode, setViewMode] = React.useState<ViewMode>("view");
  const { plants, loading, error, fetchPlants } = usePlantStore();

  const [openPlants, setOpenPlants] = React.useState<Set<number>>(new Set());
  const [selectedDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [, setLogs] = React.useState<MaintenanceLogByPlant[]>([]);
  const [, setLoadingLogs] = React.useState(false);
  const [, setNewLogIds] = React.useState<Set<number>>(new Set());

  async function refresh() {
    await fetchPlants();
  }

  async function refreshLogs() {
    setLoadingLogs(true);
    try {
      const data = await logService.getByDate(selectedDate);
      setLogs(data || []);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  }

  const handleNewLog = React.useCallback(
    (newLog: MaintenanceLog) => {
      if (!newLog || !newLog.id) return;

      setNewLogIds((prev) => new Set(prev).add(newLog.id));
      setTimeout(() => {
        setNewLogIds((prev) => {
          const next = new Set(prev);
          next.delete(newLog.id);
          return next;
        });
      }, 3000);

      setLogs((prevLogs) => {
        const logDate = newLog.checked_at
          ? new Date(newLog.checked_at).toISOString().split("T")[0]
          : "";
        if (logDate !== selectedDate) return prevLogs;

        let plantName = "Unknown Plant";
        if (newLog.unit_name) {
          const parts = newLog.unit_name.split(" - ");
          plantName = parts[0] || "Unknown Plant";
        }

        const existingPlantIndex = prevLogs.findIndex(
          (p) => p.plant === plantName,
        );

        if (existingPlantIndex >= 0) {
          const updated = [...prevLogs];
          updated[existingPlantIndex] = {
            ...updated[existingPlantIndex],
            checks: [newLog, ...updated[existingPlantIndex].checks],
          };
          return updated;
        }
        return [...prevLogs, { plant: plantName, checks: [newLog] }];
      });
    },
    [selectedDate],
  );

  React.useEffect(() => {
    fetchPlants();
  }, []);

  React.useEffect(() => {
    if (viewMode === "logs") refreshLogs();
  }, [selectedDate, viewMode]);

  React.useEffect(() => {
    if (plants && plants.length > 0 && openPlants.size === 0 && viewMode === "view") {
      setOpenPlants(new Set([plants[0].id]));
    }
  }, [plants, viewMode]);

  function togglePlant(id: number) {
    setOpenPlants((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  if (loading && viewMode === "view") return <ViewSkeleton />;

  if (error && viewMode === "view") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-red-500 p-4 bg-red-50 rounded-lg"
      >
        <AlertCircle className="h-4 w-4" />
        {error}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Tab Toggle */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted w-fit">
        <button
          onClick={() => setViewMode("view")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            viewMode === "view"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BarChart className="h-3.5 w-3.5" />
          View
        </button>
        <button
          onClick={() => setViewMode("logs")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            viewMode === "logs"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clipboard className="h-3.5 w-3.5" />
          Maintenance Logs
        </button>
      </div>

      {/* ── VIEW MODE ──────────────────────────────────────────── */}
      {viewMode === "view" && (
        <div className="space-y-3">
          <AnimatePresence>
            {plants &&
              plants.map((plant: Plant, index: number) => {
                const isOpen = openPlants.has(plant.id);

                return (
                  <motion.div
                    key={plant.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card>
                      <button
                        className="w-full flex justify-between items-center p-4 hover:bg-muted/50 transition-colors"
                        onClick={() => togglePlant(plant.id)}
                      >
                        <div className="flex items-center gap-2">
                          <Factory className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{plant.name}</span>
                        </div>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform duration-200 text-muted-foreground",
                            isOpen && "rotate-180",
                          )}
                        />
                      </button>

                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 pt-0 space-y-2">
                              {plant.units &&
                                plant.units.map((unit) => (
                                  <UnitCard
                                    key={unit.id}
                                    unit={unit}
                                    onRefresh={refresh}
                                    onLogSubmit={handleNewLog}
                                  />
                                ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div>
                );
              })}
          </AnimatePresence>
        </div>
      )}

      {/* ── LOGS MODE ─────────────────────────────────────────── */}
      {viewMode === "logs" && <MaintenanceLogForm />}
    </motion.div>
  );
}