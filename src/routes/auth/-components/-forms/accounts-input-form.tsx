"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  CheckCircle2, XCircle, CalendarIcon, Lock, Loader2,
  Pencil, X, Plus, Trash2, TrendingUp, TrendingDown, Building, Wrench,
} from "lucide-react";
import { accountService } from "@/services/accounts.service";
import { AccountType, AccountStatus, AccountPayload } from "@/types/accounts.types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AccountRow {
  id: number | null;
  localId: string;
  description: string;
  type: AccountType;
  amount: number;
  due_date: string | null;
  notes: string;
  status: AccountStatus;
  displayAmount: string;
  isReadOnly: boolean;
}

interface AccountInputFormProps {
  onSaved: () => void;
}

// ─── Status config per type ───────────────────────────────────────────────────

const STATUS_OPTIONS: Record<AccountType, { value: AccountStatus; label: string; color: string }[]> = {
  receivable: [
    { value: "received", label: "Received", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
    { value: "delayed",  label: "Delayed",  color: "bg-amber-500/10 text-amber-600 border-amber-500/30"     },
  ],
  revenue: [
    { value: "received", label: "Received", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
    { value: "delayed",  label: "Delayed",  color: "bg-amber-500/10 text-amber-600 border-amber-500/30"     },
  ],
  payable: [
    { value: "unpaid", label: "Unpaid", color: "bg-rose-500/10 text-rose-600 border-rose-500/30"         },
    { value: "paid",   label: "Paid",   color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
  ],
  expense: [
    { value: "unpaid", label: "Unpaid", color: "bg-rose-500/10 text-rose-600 border-rose-500/30"         },
    { value: "paid",   label: "Paid",   color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
  ],
  capex: [
    { value: "unpaid",  label: "Unpaid",  color: "bg-rose-500/10 text-rose-600 border-rose-500/30"         },
    { value: "pending", label: "Pending", color: "bg-amber-500/10 text-amber-600 border-amber-500/30"      },
    { value: "paid",    label: "Paid",    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
  ],
  opex: [
    { value: "unpaid",  label: "Unpaid",  color: "bg-rose-500/10 text-rose-600 border-rose-500/30"         },
    { value: "pending", label: "Pending", color: "bg-amber-500/10 text-amber-600 border-amber-500/30"      },
    { value: "paid",    label: "Paid",    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
  ],
};

function defaultStatus(type: AccountType): AccountStatus {
  if (type === "receivable" || type === "revenue") return "received";
  if (type === "capex" || type === "opex") return "pending";
  return "unpaid"; // payable and expense
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2); }
function getTodayISO() { return new Date().toLocaleDateString("en-CA"); }
function dateToISO(d: Date) { return d.toLocaleDateString("en-CA"); }

function isoToDate(iso: string) {
  const [y, m, d] = iso.split("T")[0].split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatUSD(n: number) {
  return "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDisplayValue(value: number): string {
  if (!value) return "";
  return Number.isInteger(value)
    ? value.toLocaleString()
    : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function emptyRow(): AccountRow {
  return {
    id: null,
    localId: uid(),
    description: "",
    type: "receivable",
    amount: 0,
    due_date: getTodayISO(),
    notes: "",
    status: "received",
    displayAmount: "",
    isReadOnly: false,
  };
}

function fromApi(a: any): AccountRow {
  return {
    id: a.id,
    localId: uid(),
    description: a.description,
    type: a.type,
    amount: parseFloat(a.amount),
    due_date: a.due_date ? a.due_date.split("T")[0] : null,
    notes: a.notes ?? "",
    status: a.status ?? defaultStatus(a.type),
    displayAmount: formatDisplayValue(parseFloat(a.amount)),
    isReadOnly: true,
  };
}

// ─── Type config ──────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<AccountType, { label: string; icon: React.ElementType; color: string }> = {
  receivable: { label: "Receivable", icon: TrendingUp,   color: "text-emerald-600" },
  revenue:    { label: "Revenue",    icon: TrendingUp,   color: "text-emerald-600" },
  payable:    { label: "Payable",    icon: TrendingDown, color: "text-rose-600"    },
  expense:    { label: "Expense",    icon: TrendingDown, color: "text-rose-600"    },
  capex:      { label: "CAPEX",      icon: Building,     color: "text-blue-600"    },
  opex:       { label: "OPEX",       icon: Wrench,       color: "text-amber-600"   },
};

const ALL_TYPES = Object.keys(TYPE_CONFIG) as AccountType[];

// ─── Skeletons / Banners ──────────────────────────────────────────────────────

function InputSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-4 pb-4 space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-full" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
      <CheckCircle2 className="h-4 w-4 shrink-0" /><p>{message}</p>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
      <XCircle className="h-4 w-4 shrink-0" /><p>{message}</p>
    </div>
  );
}

// ─── Status toggle (inline pill buttons) ─────────────────────────────────────

function StatusToggle({
  type,
  value,
  disabled,
  onChange,
}: {
  type: AccountType;
  value: AccountStatus;
  disabled: boolean;
  onChange: (s: AccountStatus) => void;
}) {
  const options = STATUS_OPTIONS[type];
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && onChange(opt.value)}
          className={`
            text-[11px] font-medium px-2 py-0.5 rounded-full border transition-all
            ${value === opt.value
              ? opt.color + " opacity-100"
              : "bg-transparent text-muted-foreground border-muted-foreground/20 hover:border-muted-foreground/50"
            }
            ${disabled ? "cursor-default opacity-60" : "cursor-pointer"}
          `}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AccountInputForm({ onSaved }: AccountInputFormProps) {
  const today = getTodayISO();

  const [dateISO, setDateISO] = useState(today);
  const [calOpen, setCalOpen] = useState(false);

  const [rows, setRows] = useState<AccountRow[]>([emptyRow()]);
  const [fetchingRows, setFetchingRows] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [openDueCals, setOpenDueCals] = useState<Set<string>>(new Set());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");

  const cache = useRef<Record<string, any[]>>({});

  useEffect(() => { fetchForDate(today); }, []); // eslint-disable-line

  // ── Fetch ─────────────────────────────────────────────────────────────────

  async function fetchForDate(iso: string) {
    if (cache.current[iso] !== undefined) {
      applyRows(cache.current[iso]);
      return;
    }
    setFetchingRows(true);
    try {
      const response = await accountService.getAll(iso, iso);
      cache.current[iso] = response.data;
      applyRows(response.data);
    } catch {
      cache.current[iso] = [];
      setRows([emptyRow()]);
      setUnlockedIds(new Set());
    } finally {
      setFetchingRows(false);
    }
  }

  function applyRows(accounts: any[]) {
    setRows(accounts.length === 0 ? [emptyRow()] : accounts.map(fromApi));
    setUnlockedIds(new Set());
    setConfirmDeleteId(null);
    setStatus("idle");
    setStatusMsg("");
  }

  async function handleDateChange(newISO: string) {
    setDateISO(newISO);
    setCalOpen(false);
    setStatus("idle");
    setStatusMsg("");
    await fetchForDate(newISO);
  }

  // ── Row helpers ───────────────────────────────────────────────────────────

  function updateRow(localId: string, patch: Partial<AccountRow>) {
    setRows((prev) => prev.map((r) => r.localId === localId ? { ...r, ...patch } : r));
    setStatus("idle");
  }

  function setAmount(localId: string, raw: string) {
    const val = parseFloat(raw.replace(/,/g, "")) || 0;
    updateRow(localId, { amount: val, displayAmount: raw });
  }

  function handleAmountBlur(localId: string) {
    const row = rows.find((r) => r.localId === localId);
    if (row) updateRow(localId, { displayAmount: formatDisplayValue(row.amount) });
  }

  function handleAmountFocus(localId: string) {
    const row = rows.find((r) => r.localId === localId);
    if (row) updateRow(localId, { displayAmount: row.amount ? row.amount.toString() : "" });
  }

  function handleTypeChange(localId: string, newType: AccountType) {
    const newStatus = defaultStatus(newType);
    updateRow(localId, { type: newType, status: newStatus });
  }

  function addRow() { setRows((prev) => [...prev, emptyRow()]); }

  function removeRow(localId: string) {
    setRows((prev) => prev.filter((r) => r.localId !== localId));
  }

  function unlockRow(localId: string) {
    setConfirmDeleteId(null);
    setUnlockedIds((prev) => new Set(prev).add(localId));
    updateRow(localId, { isReadOnly: false });
    setStatus("idle");
    setStatusMsg("");
  }

  function relockRow(localId: string) {
    setConfirmDeleteId(null);
    setUnlockedIds((prev) => { const n = new Set(prev); n.delete(localId); return n; });
    const cached = cache.current[dateISO] ?? [];
    const row = rows.find((r) => r.localId === localId);
    const original = cached.find((a: any) => a.id === row?.id);
    if (original) {
      setRows((prev) => prev.map((r) =>
        r.localId === localId ? { ...fromApi(original), localId } : r
      ));
    }
    setStatus("idle");
    setStatusMsg("");
  }

  function toggleDueCal(localId: string, open: boolean) {
    setOpenDueCals((prev) => { const n = new Set(prev); open ? n.add(localId) : n.delete(localId); return n; });
  }

  function handleReset() {
    const cached = cache.current[dateISO];
    if (cached?.length) {
      applyRows(cached);
    } else {
      setRows([emptyRow()]);
      setUnlockedIds(new Set());
    }
    setConfirmDeleteId(null);
    setStatus("idle");
    setStatusMsg("");
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDelete(_localId: string, id: number) {
    setIsDeleting(true);
    try {
      await accountService.delete(id);
      delete cache.current[dateISO];
      await fetchForDate(dateISO);
      setStatus("success");
      setStatusMsg("Entry deleted successfully.");
      onSaved();
    } catch (err: any) {
      setStatus("error");
      setStatusMsg(err?.response?.data?.message ?? "Failed to delete entry. Please try again.");
      setConfirmDeleteId(null);
    } finally {
      setIsDeleting(false);
    }
  }

  // ── Save ─────────────────────────────────────────────────────────────────

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    const updates: Array<{ id: number; data: AccountPayload; description: string }> = [];
    const newRecords: Array<{ data: AccountPayload }> = [];

    rows.forEach((row) => {
      if (row.isReadOnly) return;
      if (!row.description.trim() || row.amount <= 0) return;

      const payload: AccountPayload = {
        description: row.description.trim(),
        type: row.type,
        amount: row.amount,
        due_date: row.due_date,
        notes: row.notes.trim() || null,
        status: row.status,
      };

      if (row.id && row.id > 0) {
        updates.push({ id: row.id, data: payload, description: row.description.trim() });
      } else {
        newRecords.push({ data: payload });
      }
    });

    if (updates.length === 0 && newRecords.length === 0) {
      setStatus("error");
      setStatusMsg("Please fill in a description and amount, or unlock a saved entry to update it.");
      return;
    }

    setIsSaving(true);
    try {
      if (updates.length > 0) {
        await Promise.all(updates.map((u) => accountService.update(u.id, u.data)));
      }
      if (newRecords.length > 0) {
        await Promise.all(newRecords.map((r) => accountService.store(r.data)));
      }

      delete cache.current[dateISO];
      await fetchForDate(dateISO);

      // Rich success message
      const updatedDescs = updates.map((u) => `"${u.description}"`).join(", ");
      const newDescs = newRecords.map((r) => `"${r.data.description}"`).join(", ");

      let message = "";
      if (updates.length > 0 && newRecords.length > 0) {
        message = `Updated ${updatedDescs} and saved ${newDescs}`;
      } else if (updates.length > 0) {
        message = `Updated ${updatedDescs}`;
      } else {
        message = `Saved ${newDescs}`;
      }

      setStatus("success");
      setStatusMsg(`${message} for ${format(isoToDate(dateISO), "PPP")}.`);
      onSaved();
    } catch (err: any) {
      setStatus("error");
      setStatusMsg(err?.response?.data?.message ?? "Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const allReadOnly = rows.length > 0 && rows.every((r) => r.isReadOnly);
  const hasEditable = rows.some((r) => !r.isReadOnly && r.description.trim() && r.amount > 0);
  const hasUnlocked = unlockedIds.size > 0;
  const showActions = (hasEditable || hasUnlocked) && !fetchingRows;
  const isBusy = isSaving || isDeleting;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* ── Date picker card ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Account Entry</CardTitle>
          <CardDescription>Add or edit account entries by date</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 flex-wrap">
            <Label className="text-sm whitespace-nowrap">Entry Date</Label>

            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={fetchingRows || isBusy}
                  className="w-[240px] justify-start gap-2 text-left font-normal"
                >
                  <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  {format(isoToDate(dateISO), "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={isoToDate(dateISO)}
                  onSelect={(d) => d && handleDateChange(dateToISO(d))}
                  disabled={(d) => d > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {allReadOnly && !fetchingRows && unlockedIds.size === 0 && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3 shrink-0" />
                All entries saved — click <Pencil className="h-3 w-3 inline mx-0.5" /> to edit or delete
              </span>
            )}

            {unlockedIds.size > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-amber-600">
                <Pencil className="h-3 w-3 shrink-0" />
                {unlockedIds.size} entr{unlockedIds.size === 1 ? "y" : "ies"} unlocked for editing
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Banners ── */}
      {status === "success" && <SuccessBanner message={statusMsg} />}
      {status === "error"   && <ErrorBanner   message={statusMsg} />}

      {/* ── Rows ── */}
      {fetchingRows ? <InputSkeleton /> : (
        <form onSubmit={handleSave} noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {rows.map((row) => {
              const cfg = TYPE_CONFIG[row.type];
              const Icon = cfg.icon;
              const isEditable = !row.isReadOnly;
              const isUnlocked = unlockedIds.has(row.localId);
              const isPendingDelete = confirmDeleteId === row.localId;
              const currentStatusOpt = STATUS_OPTIONS[row.type].find((o) => o.value === row.status);

              return (
                <Card
                  key={row.localId}
                  className={
                    isPendingDelete
                      ? "border-rose-500/50 dark:border-rose-500/30"
                      : row.isReadOnly && !isUnlocked
                        ? "opacity-70"
                        : isUnlocked
                          ? "border-amber-500/50 dark:border-amber-500/30"
                          : undefined
                  }
                >
                  <CardContent className="pt-4 pb-4 space-y-3">

                    {/* ── Header ── */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                        <p className="text-sm font-medium">{cfg.label}</p>

                        {/* State badges */}
                        {isUnlocked && !isPendingDelete && (
                          isSaving ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 font-medium flex items-center gap-1">
                              <Loader2 className="h-2.5 w-2.5 animate-spin" />
                              updating…
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 font-medium">
                              editing
                            </span>
                          )
                        )}
                        {isPendingDelete && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 font-medium">
                            deleting
                          </span>
                        )}
                        {/* Status pill — shown when read-only */}
                        {row.id && !isUnlocked && currentStatusOpt && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${currentStatusOpt.color}`}>
                            {currentStatusOpt.label}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {row.id && (
                          isUnlocked ? (
                            <div className="flex items-center gap-1">
                              {/* Relock */}
                              <button type="button" onClick={() => relockRow(row.localId)} disabled={isBusy}
                                title="Cancel editing"
                                className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
                                <X className="h-3.5 w-3.5" />
                              </button>

                              {/* Delete with confirm */}
                              {isPendingDelete ? (
                                <span className="flex items-center gap-1">
                                  <span className="text-[10px] text-rose-600 font-medium">Sure?</span>
                                  <button type="button" onClick={() => handleDelete(row.localId, row.id!)}
                                    disabled={isBusy}
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500 text-white hover:bg-rose-600 font-medium transition-colors disabled:opacity-50">
                                    {isDeleting ? "…" : "Yes"}
                                  </button>
                                  <button type="button" onClick={() => setConfirmDeleteId(null)}
                                    disabled={isBusy}
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground hover:text-foreground font-medium transition-colors disabled:opacity-50">
                                    No
                                  </button>
                                </span>
                              ) : (
                                <button type="button" onClick={() => setConfirmDeleteId(row.localId)}
                                  disabled={isBusy} title="Delete entry"
                                  className="p-0.5 rounded text-muted-foreground hover:text-rose-500 transition-colors disabled:opacity-50">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <button type="button" onClick={() => unlockRow(row.localId)}
                              disabled={isBusy} title="Edit entry"
                              className="p-0.5 rounded text-muted-foreground hover:text-amber-600 transition-colors disabled:opacity-50">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )
                        )}

                        {!row.id && rows.length > 1 && (
                          <button type="button" onClick={() => removeRow(row.localId)} disabled={isBusy}
                            className="p-0.5 rounded text-muted-foreground hover:text-rose-500 transition-colors disabled:opacity-50">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* ── Type toggle ── */}
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_TYPES.map((t) => (
                        <button key={t} type="button"
                          onClick={() => isEditable && handleTypeChange(row.localId, t)}
                          disabled={!isEditable || isBusy}
                        >
                          <Badge
                            variant={row.type === t ? "default" : "outline"}
                            className={`px-2.5 py-0.5 text-xs select-none transition-all ${isEditable ? "cursor-pointer" : "cursor-default"}`}
                          >
                            {TYPE_CONFIG[t].label}
                          </Badge>
                        </button>
                      ))}
                    </div>

                    {/* ── Status toggle ── */}
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <StatusToggle
                        type={row.type}
                        value={row.status}
                        disabled={!isEditable || isBusy}
                        onChange={(s) => updateRow(row.localId, { status: s })}
                      />
                    </div>

                    {/* ── Description ── */}
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Description</p>
                      <Input
                        type="text"
                        placeholder="e.g. Invoice from Supplier A"
                        className={`h-9 text-sm ${!isEditable ? "bg-muted cursor-default pointer-events-none" : ""}`}
                        value={row.description}
                        readOnly={!isEditable}
                        disabled={isBusy || !isEditable}
                        onChange={(e) => updateRow(row.localId, { description: e.target.value })}
                      />
                    </div>

                    {/* ── Amount + Due date ── */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Amount (USD)</p>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                          <Input
                            type="text"
                            placeholder="0.00"
                            className={`pl-5 h-9 text-sm ${!isEditable ? "bg-muted cursor-default pointer-events-none" : ""}`}
                            value={row.displayAmount}
                            readOnly={!isEditable}
                            disabled={isBusy || !isEditable}
                            onChange={(e) => setAmount(row.localId, e.target.value)}
                            onFocus={() => handleAmountFocus(row.localId)}
                            onBlur={() => handleAmountBlur(row.localId)}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Due Date</p>
                        <Popover
                          open={openDueCals.has(row.localId)}
                          onOpenChange={(o) => isEditable && toggleDueCal(row.localId, o)}
                        >
                          <PopoverTrigger asChild>
                            <Button type="button" variant="outline"
                              disabled={isBusy || !isEditable}
                              className={`w-full justify-start gap-2 text-left font-normal h-9 text-sm ${!isEditable ? "bg-muted cursor-default pointer-events-none" : ""}`}
                            >
                              <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              {row.due_date
                                ? format(isoToDate(row.due_date), "MMM dd, yyyy")
                                : <span className="text-muted-foreground">Pick date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={row.due_date ? isoToDate(row.due_date) : undefined}
                              onSelect={(d) => {
                                updateRow(row.localId, { due_date: d ? dateToISO(d) : null });
                                toggleDueCal(row.localId, false);
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    {/* ── Notes ── */}
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Notes (optional)</p>
                      <Textarea
                        placeholder="Additional details..."
                        className={`text-sm resize-none min-h-[60px] ${!isEditable ? "bg-muted cursor-default pointer-events-none" : ""}`}
                        value={row.notes}
                        readOnly={!isEditable}
                        disabled={isBusy || !isEditable}
                        onChange={(e) => updateRow(row.localId, { notes: e.target.value })}
                      />
                    </div>

                    {/* ── Amount footer (read-only) ── */}
                    {row.isReadOnly && !isUnlocked && row.amount > 0 && (
                      <p className="text-xs text-muted-foreground text-right">
                        Amount: <span className="font-medium text-foreground">{formatUSD(row.amount)}</span>
                      </p>
                    )}

                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Add row */}
          {!allReadOnly && (
            <button type="button" onClick={addRow} disabled={isBusy}
              className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-muted-foreground/30 py-3 text-sm text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground transition-colors disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add another entry
            </button>
          )}

          {/* Save / Reset */}
          {showActions && (
            <div className="flex items-center gap-3 mt-4">
              <Button type="submit" disabled={isBusy} className="flex-1">
                {isSaving
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
                  : hasUnlocked
                    ? `Update ${unlockedIds.size} entr${unlockedIds.size === 1 ? "y" : "ies"}`
                    : "Save Entries"}
              </Button>
              <Button type="button" variant="outline" onClick={handleReset} disabled={isBusy}>
                Reset
              </Button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}