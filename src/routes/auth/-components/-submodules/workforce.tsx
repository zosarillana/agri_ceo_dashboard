"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { Users, PlusCircle, Factory, Building2, CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useWorkforceStore } from "@/store/workforce.store";
import WorkforceInputForm from "../-forms/workforce-input-form";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rateBadgeVariant(rate: number) {
  if (rate >= 90) return "default" as const;
  if (rate >= 75) return "outline" as const;
  return "destructive" as const;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

function getTodayISO() {
  return new Date().toLocaleDateString("en-CA");
}

function isoToDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function dateToISO(d: Date) {
  return d.toLocaleDateString("en-CA");
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEPARTMENT_KEYS = [
  "opex", "hr", "it", "sales", "finance", "gen_ops",
  "proc_rm", "proc_nrm", "proc_local_sales",
  "project", "field_ops", "business_ops", "engineering",
];

const DIRECT_COST_KEYS = [
  "proc_nuts_receiving", "prod_dry_process",
  "prod_liquid_line", "quality",
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ViewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2"><Skeleton className="h-3 w-28" /></CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      {[0, 1].map((i) => (
        <Card key={i}>
          <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
          <CardContent className="space-y-2">
            {Array.from({ length: 5 }).map((_, j) => (
              <Skeleton key={j} className="h-8 w-full" />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WorkforceDash() {
  const [activeTab, setActiveTab] = useState<"view" | "input">("view");

  // ── View date state ─────────────────────────────────────────────────────────
  const [dateISO, setDateISO]   = useState(getTodayISO);
  const [calOpen, setCalOpen]   = useState(false);

  const { records, summary, loading, fetchLatest } = useWorkforceStore();

  // ── Initial fetch ───────────────────────────────────────────────────────────
  const fetched = useRef(false);
  useEffect(() => {
    if (!fetched.current) {
      fetched.current = true;
      fetchLatest(dateISO, dateISO);
    }
  }, [fetchLatest, dateISO]);

  // ── Date change ─────────────────────────────────────────────────────────────
  function handleDateChange(date: Date | undefined) {
    if (!date) return;
    const iso = dateToISO(date);
    setDateISO(iso);
    setCalOpen(false);
    fetchLatest(iso, iso);
  }

  function handleClear() {
    const today = getTodayISO();
    setDateISO(today);
    fetchLatest(today, today);
  }

  // ── Split records by section ────────────────────────────────────────────────
  const deptRecords   = records.filter((r) => DEPARTMENT_KEYS.includes(r.department_key));
  const directRecords = records.filter((r) => DIRECT_COST_KEYS.includes(r.department_key));

  // ── Section totals ──────────────────────────────────────────────────────────
  const deptPresent   = deptRecords.reduce((s, r) => s + r.present, 0);
  const deptHeadcount = deptRecords.reduce((s, r) => s + r.headcount, 0);
  const deptIncidents = deptRecords.reduce((s, r) => s + r.incidents, 0);
  const deptRate      = deptHeadcount > 0 ? Math.round((deptPresent / deptHeadcount) * 100) : 0;

  const directPresent   = directRecords.reduce((s, r) => s + r.present, 0);
  const directHeadcount = directRecords.reduce((s, r) => s + r.headcount, 0);
  const directIncidents = directRecords.reduce((s, r) => s + r.incidents, 0);
  const directRate      = directHeadcount > 0 ? Math.round((directPresent / directHeadcount) * 100) : 0;

  // ── Summary ─────────────────────────────────────────────────────────────────
  const { total_present, total_headcount, total_incidents, attendance_rate } = summary;
  const overallRate = attendance_rate ?? 0;
  const directSplit = total_headcount > 0 ? Math.round((directHeadcount / total_headcount) * 100) : 0;
  const deptSplit   = total_headcount > 0 ? Math.round((deptHeadcount   / total_headcount) * 100) : 0;

  const isToday     = dateISO === getTodayISO();
  const selectedDate = isoToDate(dateISO);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted w-fit">
        {(["view", "input"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${
              activeTab === t
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "view"  && <Users      className="h-3.5 w-3.5" />}
            {t === "input" && <PlusCircle className="h-3.5 w-3.5" />}
            {t}
          </button>
        ))}
      </div>

      {/* ── VIEW TAB ── */}
      {activeTab === "view" && (
        <div className="space-y-4">

          {/* Date picker — same pattern as SalesDash */}
          <div className="flex items-end gap-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Date</p>
              <Popover open={calOpen} onOpenChange={setCalOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={loading}
                    className={cn(
                      "w-[240px] justify-start text-left font-normal h-9",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateChange}
                    disabled={(d) => d > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {!isToday && (
              <Button size="sm" variant="outline" onClick={handleClear} className="h-9">
                Today
              </Button>
            )}
          </div>

          {loading ? <ViewSkeleton /> : (
            <div className="space-y-6">

              {/* Summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Present Today</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{fmt(total_present)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      of {fmt(total_headcount)} total
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Headcount</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{fmt(total_headcount)}</div>
                    <div className="mt-1">
                      <Badge variant={rateBadgeVariant(overallRate)}>
                        {overallRate}% Attendance Rate
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Safety Incidents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${total_incidents > 0 ? "text-destructive" : "text-green-600"}`}>
                      {fmt(total_incidents)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(selectedDate, "MMM d, yyyy")}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Direct / Indirect Split</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{directSplit}% / {deptSplit}%</div>
                    <p className="text-xs text-muted-foreground mt-1">Direct vs Department</p>
                  </CardContent>
                </Card>
              </div>

              {/* DEPARTMENT table */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    DEPARTMENT
                  </CardTitle>
                  <Badge variant="outline" className="font-normal">
                    {deptRecords.length} Departments
                  </Badge>
                </CardHeader>
                <CardContent className="pt-0">
                  {deptRecords.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No records found for {format(selectedDate, "MMM d, yyyy")}.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="font-semibold w-[260px]">Department</TableHead>
                          <TableHead className="text-right font-semibold w-28">Present</TableHead>
                          <TableHead className="text-right font-semibold w-28">Headcount</TableHead>
                          <TableHead className="text-right font-semibold w-28">Incidents</TableHead>
                          <TableHead className="text-right font-semibold w-24">Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {deptRecords.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">{r.department_label}</TableCell>
                            <TableCell className="text-right tabular-nums">{r.present}</TableCell>
                            <TableCell className="text-right tabular-nums">{r.headcount}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {r.incidents > 0
                                ? <span className="text-destructive font-medium">{r.incidents}</span>
                                : r.incidents}
                            </TableCell>
                            <TableCell className="text-right">
                              {r.attendance_rate !== null ? (
                                <Badge variant={rateBadgeVariant(r.attendance_rate)}>
                                  {r.attendance_rate}%
                                </Badge>
                              ) : <span className="text-xs text-muted-foreground">—</span>}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="border-t-2 bg-muted/30 hover:bg-muted/30">
                          <TableCell className="font-semibold">Total DEPARTMENT</TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">{deptPresent}</TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">{deptHeadcount}</TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">{deptIncidents}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={rateBadgeVariant(deptRate)}>{deptRate}%</Badge>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* DIRECT COST table */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Factory className="h-5 w-5" />
                    DIRECT COST
                  </CardTitle>
                  <Badge variant="outline" className="font-normal">
                    {directRecords.length} Cost Centers
                  </Badge>
                </CardHeader>
                <CardContent className="pt-0">
                  {directRecords.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No records found for {format(selectedDate, "MMM d, yyyy")}.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="font-semibold w-[260px]">Cost Center</TableHead>
                          <TableHead className="text-right font-semibold w-28">Present</TableHead>
                          <TableHead className="text-right font-semibold w-28">Headcount</TableHead>
                          <TableHead className="text-right font-semibold w-28">Incidents</TableHead>
                          <TableHead className="text-right font-semibold w-24">Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {directRecords.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">{r.department_label}</TableCell>
                            <TableCell className="text-right tabular-nums">{r.present}</TableCell>
                            <TableCell className="text-right tabular-nums">{r.headcount}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {r.incidents > 0
                                ? <span className="text-destructive font-medium">{r.incidents}</span>
                                : r.incidents}
                            </TableCell>
                            <TableCell className="text-right">
                              {r.attendance_rate !== null ? (
                                <Badge variant={rateBadgeVariant(r.attendance_rate)}>
                                  {r.attendance_rate}%
                                </Badge>
                              ) : <span className="text-xs text-muted-foreground">—</span>}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="border-t-2 bg-muted/30 hover:bg-muted/30">
                          <TableCell className="font-semibold">Total DIRECT COST</TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">{directPresent}</TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">{directHeadcount}</TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">{directIncidents}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={rateBadgeVariant(directRate)}>{directRate}%</Badge>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Grand Total */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    TOTAL WORKFORCE
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Total Present</p>
                      <p className="text-2xl font-bold">{fmt(total_present)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Total Headcount</p>
                      <p className="text-2xl font-bold">{fmt(total_headcount)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Total Incidents</p>
                      <p className="text-2xl font-bold">{fmt(total_incidents)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Overall Attendance</p>
                      <Badge variant={rateBadgeVariant(overallRate)} className="text-lg px-3 py-1">
                        {overallRate}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          )}
        </div>
      )}

      {/* ── INPUT TAB ── */}
      {activeTab === "input" && (
        <WorkforceInputForm onSaved={() => setActiveTab("view")} />
      )}
    </div>
  );
}