// src/routes/auth/.../accounts.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { BarChart2, PlusCircle, CalendarIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAccountStore } from "@/store/accounts.store";
import { Account, AccountType } from "@/types/accounts.types";
import AccountInputForm from "../-forms/accounts-input-form";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "view" | "input";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPHP(n: number) {
  return "₱" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function accountBadge(type: AccountType) {
  const map: Record<AccountType, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    receivable: { label: "Receivable", variant: "default"     },
    revenue:    { label: "Revenue",    variant: "default"     },
    payable:    { label: "Payable",    variant: "secondary"   },
    expense:    { label: "Expense",    variant: "destructive" },
    capex:      { label: "CAPEX",      variant: "outline"     },
    opex:       { label: "OPEX",       variant: "outline"     },
  };
  const { label, variant } = map[type];
  return <Badge variant={variant}>{label}</Badge>;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AccountTable({ accounts }: { accounts: Account[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Description</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right">Due Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {accounts.map((a) => (
          <TableRow key={a.id} className={a.is_paid ? "opacity-50" : ""}>
            <TableCell className="font-medium">{a.description}</TableCell>
            <TableCell>{accountBadge(a.type)}</TableCell>
            <TableCell>
              {a.is_paid
                ? <Badge variant="outline" className="text-emerald-500 border-emerald-500">Paid</Badge>
                : <Badge variant="outline" className="text-amber-500 border-amber-500">Unpaid</Badge>}
            </TableCell>
            <TableCell className="text-right tabular-nums">{fmtPHP(a.amount)}</TableCell>
            <TableCell className="text-right tabular-nums">
              {a.due_date ? format(new Date(a.due_date), "MMM dd, yyyy") : "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ViewSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><CardContent className="pt-4 pb-4 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-32" />
          </CardContent></Card>
        ))}
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}><CardContent className="pt-4 space-y-2">
          {Array.from({ length: 3 }).map((_, j) => (
            <Skeleton key={j} className="h-8 w-full" />
          ))}
        </CardContent></Card>
      ))}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AccountsDash() {
  const [tab, setTab] = useState<Tab>("view");

  const { accounts, summary, dateRange, loading, fetchAll, setDateRange, clearDateRange } = useAccountStore();

  const fetched = useRef(false);
  useEffect(() => {
    if (!fetched.current) { fetched.current = true; fetchAll(); }
  }, [fetchAll]);

  // ── Date filter state ─────────────────────────────────────────────────────
  const [from, setFrom] = useState<Date | undefined>(
    dateRange.from ? new Date(dateRange.from) : undefined,
  );
  const [to, setTo] = useState<Date | undefined>(
    dateRange.to ? new Date(dateRange.to) : undefined,
  );

  useEffect(() => {
    setFrom(dateRange.from ? new Date(dateRange.from) : undefined);
    setTo(dateRange.to   ? new Date(dateRange.to)   : undefined);
  }, [dateRange.from, dateRange.to]);

  function handleFilter() {
    setDateRange({
      from: from ? format(from, "yyyy-MM-dd") : null,
      to:   to   ? format(to,   "yyyy-MM-dd") : null,
    });
  }

  function handleClearFilter() {
    setFrom(undefined);
    setTo(undefined);
    clearDateRange();
  }

  // ── Filtered sections ─────────────────────────────────────────────────────
  const receivables = accounts.filter((a) => a.type === "receivable" || a.type === "revenue");
  const payables    = accounts.filter((a) => a.type === "payable"    || a.type === "expense");
  const capex       = accounts.filter((a) => a.type === "capex");
  const opex        = accounts.filter((a) => a.type === "opex");

  const sections = [
    { title: "Receivables",                  data: receivables },
    { title: "Payables",                     data: payables    },
    { title: "Capital Expenditures (CAPEX)", data: capex       },
    { title: "Operating Expenses (OPEX)",    data: opex        },
  ];

  return (
    <div className="space-y-4">
      {/* Tabs */}
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
            {t === "view"  && <BarChart2   className="h-3.5 w-3.5" />}
            {t === "input" && <PlusCircle  className="h-3.5 w-3.5" />}
            {t}
          </button>
        ))}
      </div>

      {/* ── VIEW TAB ── */}
      {tab === "view" && (
        <div className="space-y-4">
          {/* Date filter */}
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">From</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal h-9", !from && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {from ? format(from, "PPP") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={from} onSelect={setFrom} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">To</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal h-9", !to && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {to ? format(to, "PPP") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={to}
                    onSelect={setTo}
                    disabled={from ? { before: from } : undefined}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button size="sm" onClick={handleFilter} className="h-9">Filter</Button>

            {(dateRange.from || dateRange.to) && (
              <Button size="sm" variant="outline" onClick={handleClearFilter} className="h-9">Clear</Button>
            )}
          </div>

          {loading ? <ViewSkeleton /> : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Receivable", value: summary.total_receivable },
                  { label: "Payable",    value: summary.total_payable    },
                  { label: "CAPEX",      value: summary.total_capex      },
                  { label: "OPEX",       value: summary.total_opex       },
                ].map((s) => (
                  <Card key={s.label}><CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                    <p className="text-2xl font-semibold">{fmtPHP(s.value)}</p>
                  </CardContent></Card>
                ))}
              </div>

              {/* Section tables */}
              {sections.map((section) => (
                <Card key={section.title}>
                  <CardContent className="pt-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">{section.title}</h3>
                    {section.data.length === 0
                      ? <p className="text-sm text-muted-foreground py-4 text-center">No {section.title.toLowerCase()} recorded.</p>
                      : <AccountTable accounts={section.data} />}
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      )}

      {/* ── INPUT TAB ── */}
      {tab === "input" && (
        <AccountInputForm
          onSaved={() => {
            const { from, to } = dateRange;
            fetchAll(from ?? undefined, to ?? undefined);
            setTab("view");
          }}
        />
      )}
    </div>
  );
}