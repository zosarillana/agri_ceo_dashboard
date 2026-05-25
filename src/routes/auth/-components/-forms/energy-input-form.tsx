"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CheckCircle2,
  XCircle,
  CalendarIcon,
  Lock,
  Loader2,
  Pencil,
  X,
} from "lucide-react";

import { useEnergyStore } from "@/store/energy.store";
import { EnergyPayload, AccountKey } from "@/types/energy.types";

/* ───────────────────────────────────────────────────────────── */

interface InputRow {
  kw: string;
  demand: string;
  billedAmount: string;
  isReadOnly: boolean;
}

type InputRows = Record<AccountKey, InputRow>;

interface Props {
  onSaved: () => void;
}

/* ───────────────────────────────────────────────────────────── */

function getTodayMonth() {
  return new Date().toLocaleDateString("en-CA").slice(0, 7);
}

function isoToDate(iso: string) {
  const [y, m] = iso.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

function emptyInputRows(): InputRows {
  return {
    account2: { kw: "", demand: "", billedAmount: "", isReadOnly: false },
    account3: { kw: "", demand: "", billedAmount: "", isReadOnly: false },
  };
}

// Helper function to format numbers with commas for display
function formatDisplayValue(value: string | number): string {
  if (value === "" || value === null || value === undefined) return "";
  
  // Convert to number
  let num = typeof value === 'string' ? parseFloat(value) : value;
  
  // Return empty if not a valid number
  if (isNaN(num)) return "";
  
  // Format with commas and appropriate decimal places
  if (Number.isInteger(num)) {
    return num.toLocaleString();
  } else {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}

/* ───────────────────────────────────────────────────────────── */

const ACCOUNT_LABELS: Record<AccountKey, string> = {
  account2: "Account 2",
  account3: "Account 3",
};

/* ───────────────────────────────────────────────────────────── */

function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
      <CheckCircle2 className="h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
      <XCircle className="h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
  );
}

function InputSkeleton() {
  return (
    <div className="grid md:grid-cols-2 gap-3">
      {[0, 1].map((i) => (
        <Card key={i}>
          <CardContent className="pt-4 pb-4 space-y-3">
            <div className="flex items-baseline justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-9 w-full rounded-md" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────── */

export default function EnergyInputForm({ onSaved }: Props) {
  const today = getTodayMonth();

  const { data, fetchByMonth, saveBulk, saving } = useEnergyStore();

  const [monthISO, setMonthISO]     = useState(today);
  const [calOpen, setCalOpen]       = useState(false);
  const [rows, setRows]             = useState<InputRows>(emptyInputRows());
  const [fetchingRows, setFetchingRows] = useState(false);
  const [status, setStatus]         = useState<"idle" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg]   = useState("");

  // Track which accounts have been manually unlocked for editing
  const [unlockedKeys, setUnlockedKeys] = useState<Set<AccountKey>>(new Set());

  // Display values for formatted numbers
  const [displayValues, setDisplayValues] = useState<Record<AccountKey, { kw: string; demand: string; billedAmount: string }>>({
    account2: { kw: "", demand: "", billedAmount: "" },
    account3: { kw: "", demand: "", billedAmount: "" },
  });

  // Cache raw data per month so we can restore on relock
  const cache = useRef<Record<string, InputRows>>({});

  /* ───────────────────────────────────────────── */

  // Initialize display values when rows change
  useEffect(() => {
    const newDisplay: Record<AccountKey, { kw: string; demand: string; billedAmount: string }> = {
      account2: { kw: "", demand: "", billedAmount: "" },
      account3: { kw: "", demand: "", billedAmount: "" },
    };
    
    Object.entries(rows).forEach(([key, row]) => {
      const accountKey = key as AccountKey;
      newDisplay[accountKey] = {
        kw: row.kw ? formatDisplayValue(row.kw) : "",
        demand: row.demand ? formatDisplayValue(row.demand) : "",
        billedAmount: row.billedAmount ? formatDisplayValue(row.billedAmount) : ""
      };
    });
    setDisplayValues(newDisplay);
  }, [rows]);

  useEffect(() => {
    loadMonth(today);
  }, []);

  useEffect(() => {
    if (data) {
      const populated: InputRows = {
        account2: mapRecord("account2"),
        account3: mapRecord("account3"),
      };
      setRows(populated);
      cache.current[monthISO] = populated;
      setFetchingRows(false);
    }
  }, [data]);

  function mapRecord(account: AccountKey): InputRow {
    const record = data?.[account]?.find(
      (r) => r.billing_month.slice(0, 7) === monthISO,
    );
    const hasData = record && (record.kw > 0 || record.billed_amount > 0);
    return {
      kw:           record ? String(record.kw)            : "",
      demand:       record ? String(record.demand)         : "",
      billedAmount: record ? String(record.billed_amount)  : "",
      isReadOnly:   !!hasData,
    };
  }

  /* ───────────────────────────────────────────── */

  async function loadMonth(iso: string) {
    setMonthISO(iso);
    setStatus("idle");
    setStatusMsg("");
    setUnlockedKeys(new Set());

    if (cache.current[iso]) {
      setRows(cache.current[iso]);
      return;
    }

    setFetchingRows(true);
    await fetchByMonth(iso);
    // rows are set via the useEffect above when `data` updates
  }

  function handleMonthSelect(d: Date | undefined) {
    if (!d) return;
    const iso = d.toLocaleDateString("en-CA").slice(0, 7);
    loadMonth(iso);
    setCalOpen(false);
  }

  function setField(
    account: AccountKey,
    field: keyof Omit<InputRow, "isReadOnly">,
    formattedValue: string,
  ) {
    if (rows[account].isReadOnly && !unlockedKeys.has(account)) return;
    
    // Remove commas to get raw number
    const rawValue = formattedValue.replace(/,/g, '');
    
    setRows((r) => ({ ...r, [account]: { ...r[account], [field]: rawValue } }));
    
    // Update display value with formatted version
    setDisplayValues(prev => ({
      ...prev,
      [account]: {
        ...prev[account],
        [field]: formattedValue
      }
    }));
    
    setStatus("idle");
  }

  function handleBlur(account: AccountKey, field: keyof Omit<InputRow, "isReadOnly">) {
    const row = rows[account];
    if (row) {
      const value = row[field];
      const formatted = formatDisplayValue(value);
      setDisplayValues(prev => ({
        ...prev,
        [account]: {
          ...prev[account],
          [field]: formatted
        }
      }));
    }
  }

  function handleFocus(account: AccountKey, field: keyof Omit<InputRow, "isReadOnly">) {
    const row = rows[account];
    if (row) {
      const rawValue = row[field];
      setDisplayValues(prev => ({
        ...prev,
        [account]: {
          ...prev[account],
          [field]: rawValue
        }
      }));
    }
  }

  /* ───────────────────────────────────────────── */
  // Unlock / Relock (mirrors SalesInputForm pattern)

  function unlockAccount(key: AccountKey) {
    setUnlockedKeys((prev) => new Set(prev).add(key));
    setRows((prev) => ({
      ...prev,
      [key]: { ...prev[key], isReadOnly: false },
    }));
    setStatus("idle");
    setStatusMsg("");
  }

  function relockAccount(key: AccountKey) {
    setUnlockedKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });

    // Restore values from cache
    const cached = cache.current[monthISO];
    if (cached?.[key]) {
      setRows((prev) => ({
        ...prev,
        [key]: { ...cached[key], isReadOnly: true },
      }));
    } else {
      setRows((prev) => ({
        ...prev,
        [key]: { kw: "", demand: "", billedAmount: "", isReadOnly: false },
      }));
    }
    setStatus("idle");
    setStatusMsg("");
  }

  function handleReset() {
    const cached = cache.current[monthISO];
    if (cached) {
      setRows(cached);
    } else {
      setRows(emptyInputRows());
    }
    setUnlockedKeys(new Set());
    setStatus("idle");
    setStatusMsg("");
  }

  /* ───────────────────────────────────────────── */

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    const keys: AccountKey[] = ["account2", "account3"];

    const payload: EnergyPayload[] = keys
      .filter((k) => {
        // Save if: unlocked (update) OR editable with values (create)
        if (unlockedKeys.has(k)) return true;
        if (!rows[k].isReadOnly) {
          const kw = parseFloat(rows[k].kw) || 0;
          const ba = parseFloat(rows[k].billedAmount) || 0;
          return kw > 0 || ba > 0;
        }
        return false;
      })
      .map((k) => ({
        account:       k,
        month:         monthISO,
        kw:            parseFloat(rows[k].kw)            || 0,
        demand:        parseFloat(rows[k].demand)         || 0,
        billedAmount:  parseFloat(rows[k].billedAmount)   || 0,
      }));

    if (!payload.length) {
      setStatus("error");
      setStatusMsg(
        "Please enter values first, or unlock a saved entry to update it.",
      );
      return;
    }

    try {
      await saveBulk(payload);

      // Invalidate cache and re-fetch so read-only state is accurate
      delete cache.current[monthISO];
      setFetchingRows(true);
      await fetchByMonth(monthISO);
      setUnlockedKeys(new Set());

      const isUpdate = payload.some((p) =>
        unlockedKeys.has(p.account as AccountKey),
      );

      setStatus("success");
      setStatusMsg(
        `Energy records ${isUpdate ? "updated" : "saved"} for ${format(isoToDate(monthISO), "MMMM yyyy")}.`,
      );
      onSaved();
    } catch (err: any) {
      setStatus("error");
      setStatusMsg(
        err?.response?.data?.message ?? "Something went wrong. Please try again.",
      );
    }
  }

  /* ───────────────────────────────────────────── */

  const keys: AccountKey[]    = ["account2", "account3"];
  const isAllReadOnly         = keys.every((k) => rows[k].isReadOnly) && unlockedKeys.size === 0;
  const hasEditableRows       = keys.some((k) => !rows[k].isReadOnly);
  const hasUnlockedRows       = unlockedKeys.size > 0;
  const showActionButtons     = (hasEditableRows || hasUnlockedRows) && !fetchingRows;
  const selectedDate          = isoToDate(monthISO);

  /* ───────────────────────────────────────────── */

  return (
    <div className="space-y-4">

      {/* ── Month picker ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Energy Entry</CardTitle>
          <CardDescription>Input monthly consumption per account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 flex-wrap">
            <Label className="text-sm whitespace-nowrap">Month</Label>

            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={fetchingRows || saving}
                  className="w-[200px] justify-start gap-2 text-left font-normal"
                >
                  <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  {format(selectedDate, "MMMM yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleMonthSelect}
                  disabled={(d) => d > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {isAllReadOnly && !fetchingRows && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3 shrink-0" />
                All saved — click <Pencil className="h-3 w-3 inline mx-0.5" /> to update
              </span>
            )}

            {hasUnlockedRows && (
              <span className="flex items-center gap-1.5 text-xs text-amber-600">
                <Pencil className="h-3 w-3 shrink-0" />
                {unlockedKeys.size} account{unlockedKeys.size === 1 ? "" : "s"} unlocked for editing
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Status banners ── */}
      {status === "success" && <SuccessBanner message={statusMsg} />}
      {status === "error"   && <ErrorBanner   message={statusMsg} />}

      {/* ── Account tiles ── */}
      {fetchingRows ? (
        <InputSkeleton />
      ) : (
        <form onSubmit={handleSave} noValidate>
          <div className="grid md:grid-cols-2 gap-3">
            {keys.map((key) => {
              const row        = rows[key];
              const isReadOnly = row.isReadOnly;
              const isUnlocked = unlockedKeys.has(key);
              const isEditable = !isReadOnly || isUnlocked;
              const displayRow = displayValues[key];

              return (
                <Card
                  key={key}
                  className={
                    isReadOnly && !isUnlocked
                      ? "opacity-70"
                      : isUnlocked
                        ? "border-amber-500/50 dark:border-amber-500/30"
                        : undefined
                  }
                >
                  <CardContent className="pt-4 pb-4 space-y-3">

                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{ACCOUNT_LABELS[key]}</p>
                        {isUnlocked && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 font-medium">
                            editing
                          </span>
                        )}
                        {isReadOnly && !isUnlocked && (
                          <Badge variant="outline" className="text-[10px] py-0 h-5">
                            Saved
                          </Badge>
                        )}
                      </div>

                      {/* Unlock / Relock button */}
                      {(isReadOnly || isUnlocked) && (
                        isUnlocked ? (
                          <button
                            type="button"
                            onClick={() => relockAccount(key)}
                            disabled={saving}
                            className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                            aria-label="Cancel edit"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => unlockAccount(key)}
                            disabled={saving}
                            className="p-0.5 rounded text-muted-foreground hover:text-amber-600 transition-colors disabled:opacity-50"
                            aria-label="Edit entry"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )
                      )}
                    </div>

                    {/* kW */}
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">kW</p>
                      <Input
                        type="text"
                        min={0}
                        step="0.01"
                        placeholder="0.00"
                        value={displayRow?.kw ?? (row.kw ? formatDisplayValue(row.kw) : "")}
                        readOnly={!isEditable}
                        disabled={saving || !isEditable}
                        className={!isEditable ? "bg-muted cursor-default pointer-events-none" : ""}
                        onChange={(e) => setField(key, "kw", e.target.value)}
                        onFocus={() => handleFocus(key, "kw")}
                        onBlur={() => handleBlur(key, "kw")}
                      />
                    </div>

                    {/* Demand */}
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Demand</p>
                      <Input
                        type="text"
                        min={0}
                        step="0.01"
                        placeholder="0.00"
                        value={displayRow?.demand ?? (row.demand ? formatDisplayValue(row.demand) : "")}
                        readOnly={!isEditable}
                        disabled={saving || !isEditable}
                        className={!isEditable ? "bg-muted cursor-default pointer-events-none" : ""}
                        onChange={(e) => setField(key, "demand", e.target.value)}
                        onFocus={() => handleFocus(key, "demand")}
                        onBlur={() => handleBlur(key, "demand")}
                      />
                    </div>

                    {/* Billed Amount */}
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Billed Amount (₱)</p>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                          ₱
                        </span>
                        <Input
                          type="text"
                          min={0}
                          step="0.01"
                          placeholder="0.00"
                          value={displayRow?.billedAmount ?? (row.billedAmount ? formatDisplayValue(row.billedAmount) : "")}
                          readOnly={!isEditable}
                          disabled={saving || !isEditable}
                          className={`pl-5 ${!isEditable ? "bg-muted cursor-default pointer-events-none" : ""}`}
                          onChange={(e) => setField(key, "billedAmount", e.target.value)}
                          onFocus={() => handleFocus(key, "billedAmount")}
                          onBlur={() => handleBlur(key, "billedAmount")}
                        />
                      </div>
                    </div>

                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Save / Reset */}
          {showActionButtons && (
            <div className="flex items-center gap-3 mt-4">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
                ) : hasUnlockedRows ? (
                  `Update ${unlockedKeys.size} account${unlockedKeys.size === 1 ? "" : "s"}`
                ) : (
                  "Save Energy Records"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={saving}
              >
                Reset
              </Button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}