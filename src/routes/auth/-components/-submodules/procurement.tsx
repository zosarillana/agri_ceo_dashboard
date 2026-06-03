// submodules/procurement.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { BarChart2, CalendarIcon, PlusCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useProcurementStore } from "@/store/procurement.store";
import { ProcurementStatus } from "@/types/procurement.types";
import ProcurementInputForm from "../-forms/procurement-input-form";

function fmt(n: number) {
  return n.toLocaleString();
}

function procurementBadge(status: ProcurementStatus) {
  if (status === "received")
    return (
      <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-0">
        Received
      </Badge>
    );
  if (status === "pending") return <Badge variant="outline">Pending</Badge>;
  return <Badge variant="destructive">Delayed</Badge>;
}

type Tab = "view" | "input";

function ViewSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-4 pb-4 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="pt-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProcurementDash() {
  const [tab, setTab] = useState<Tab>("view");

  const {
    records,
    summary,
    loading,
    fetchLatest,
    setDateRange,
    clearDateRange,
  } = useProcurementStore();

  const fetched = useRef(false);
  useEffect(() => {
    if (!fetched.current) {
      fetched.current = true;
      fetchLatest();
    }
  }, [fetchLatest]);

  // Date range filter state
  const [from, setFrom] = useState<Date | undefined>();
  const [to, setTo] = useState<Date | undefined>();

  function handleFilter() {
    setDateRange({
      from: from ? format(from, "yyyy-MM-dd") : null,
      to: to ? format(to, "yyyy-MM-dd") : null,
    });
  }

  function handleClearFilter() {
    setFrom(undefined);
    setTo(undefined);
    clearDateRange();
  }

  function handleSaved() {
    fetchLatest(); // 👈 let store decide based on its dateRange
    setTab("view");
  }
  
  return (
    <div className="space-y-4">
      {/* ── Tab navigation ── */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted w-fit">
        {(["view", "input"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${
              tab === t
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "view" && <BarChart2 className="h-3.5 w-3.5" />}
            {t === "input" && <PlusCircle className="h-3.5 w-3.5" />}
            {t}
          </button>
        ))}
      </div>

      {/* ── View tab ── */}
      {tab === "view" && (
        <div className="space-y-4">
          {/* Date filter bar */}
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">From</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[180px] justify-start text-left font-normal h-9",
                      !from && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {from ? format(from, "PPP") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={from}
                    onSelect={setFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">To</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[180px] justify-start text-left font-normal h-9",
                      !to && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {to ? format(to, "PPP") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={to}
                    onSelect={setTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button size="sm" onClick={handleFilter} className="h-9">
              Filter
            </Button>

            {(from || to) && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearFilter}
                className="h-9"
              >
                Clear
              </Button>
            )}
          </div>

          {loading ? (
            <ViewSkeleton />
          ) : (
            <>
              {/* Summary stat cards — now 4 across */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground mb-1">
                      Total Items
                    </p>
                    <p className="text-2xl font-semibold">
                      {summary.total_items}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground mb-1">
                      Received
                    </p>
                    <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
                      {summary.received}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground mb-1">
                      Pending
                    </p>
                    <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">
                      {summary.pending}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground mb-1">
                      Delayed
                    </p>
                    <p className="text-2xl font-semibold text-red-500 dark:text-red-400">
                      {summary.delayed}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Records table */}
              {records.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-sm text-muted-foreground">
                    No procurement records found for the selected period.
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Supplier</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-right">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.isArray(records) &&
                          records.map((p) => (
                            <TableRow key={p.id}>
                              <TableCell className="font-medium">
                                {p.item_name}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {p.supplier ?? "—"}
                              </TableCell>
                              <TableCell className="text-right">
                                {fmt(Number(p.quantity))} {p.unit}
                              </TableCell>
                              <TableCell className="text-center">
                                {procurementBadge(p.status)}
                              </TableCell>
                              <TableCell className="text-right text-xs text-muted-foreground">
                                {p.procurement_date
                                  ? format(
                                      new Date(p.procurement_date),
                                      "MMM d, yyyy",
                                    )
                                  : "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Input tab ── */}
      {tab === "input" && <ProcurementInputForm onSaved={handleSaved} />}
    </div>
  );
}
