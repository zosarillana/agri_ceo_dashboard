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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon, Lock,
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

/* ───────────────────────────────────────────────────────────── */

const ACCOUNT_LABELS: Record<AccountKey, string> = {
  account2: "Account 2",
  account3: "Account 3",
};

/* ───────────────────────────────────────────────────────────── */

export default function EnergyInputForm({ onSaved }: Props) {
  const today = getTodayMonth();

  const {
    data,
    fetchByMonth,
    saveBulk,
    saving,
  } = useEnergyStore();

  const [monthISO, setMonthISO] = useState(today);
  const [calOpen, setCalOpen] = useState(false);
  const [rows, setRows] = useState<InputRows>(emptyInputRows());
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");

  const cache = useRef<Record<string, InputRows>>({});

  /* ───────────────────────────────────────────── */

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
    }
  }, [data]);

  function mapRecord(account: AccountKey): InputRow {
    const record = data?.[account]?.find(
      (r) => r.billing_month.slice(0, 7) === monthISO
    );

    const hasData = record && (record.kw > 0 || record.billed_amount > 0);

    return {
      kw: record ? String(record.kw) : "",
      demand: record ? String(record.demand) : "",
      billedAmount: record ? String(record.billed_amount) : "",
      isReadOnly: !!hasData,
    };
  }

  /* ───────────────────────────────────────────── */

  async function loadMonth(iso: string) {
    setMonthISO(iso);
    setStatus("idle");

    if (cache.current[iso]) {
      setRows(cache.current[iso]);
      return;
    }

    await fetchByMonth(iso);
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
    value: string
  ) {
    if (rows[account].isReadOnly) return;

    setRows((r) => ({
      ...r,
      [account]: { ...r[account], [field]: value },
    }));
  }

  /* ───────────────────────────────────────────── */

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    const payload: EnergyPayload[] = (["account2", "account3"] as AccountKey[])
      .filter((k) => !rows[k].isReadOnly)
      .map((k) => ({
        account: k,
        month: monthISO,
        kw: parseFloat(rows[k].kw) || 0,
        demand: parseFloat(rows[k].demand) || 0,
        billedAmount: parseFloat(rows[k].billedAmount) || 0,
      }))
      .filter((r) => r.kw > 0 || r.billedAmount > 0);

    if (!payload.length) {
      setStatus("error");
      setStatusMsg("Please enter values first.");
      return;
    }

    try {
      await saveBulk(payload);

      setStatus("success");
      setStatusMsg(
        `Saved for ${format(isoToDate(monthISO), "MMMM yyyy")}`
      );

      onSaved();
    } catch {
      setStatus("error");
      setStatusMsg("Failed to save.");
    }
  }

  const isAllReadOnly = (["account2", "account3"] as AccountKey[])
    .every((k) => rows[k].isReadOnly);

  const hasEditableRows = (["account2", "account3"] as AccountKey[])
    .some((k) => !rows[k].isReadOnly);

  const selectedDate = isoToDate(monthISO);

  /* ───────────────────────────────────────────── */

  return (
    <div className="space-y-4">

      <Card>
        <CardHeader>
          <CardTitle>Energy Entry</CardTitle>
          <CardDescription>Input monthly consumption</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex gap-3 items-center">
            <Label>Month</Label>

            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {format(selectedDate, "MMMM yyyy")}
                </Button>
              </PopoverTrigger>

              <PopoverContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleMonthSelect}
                />
              </PopoverContent>
            </Popover>

            {isAllReadOnly && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Lock className="w-3 h-3" /> Saved
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {status === "success" && <p className="text-green-500">{statusMsg}</p>}
      {status === "error" && <p className="text-red-500">{statusMsg}</p>}

      <form onSubmit={handleSave}>
        <div className="grid md:grid-cols-2 gap-3">

          {(["account2", "account3"] as AccountKey[]).map((key) => {
            const row = rows[key];

            return (
              <Card key={key}>
                <CardContent className="space-y-2">

                  <div className="flex justify-between">
                    <p>{ACCOUNT_LABELS[key]}</p>
                    {row.isReadOnly && <Badge>Saved</Badge>}
                  </div>

                  <Input
                    value={row.kw}
                    onChange={(e) => setField(key, "kw", e.target.value)}
                    disabled={row.isReadOnly}
                    placeholder="kW"
                  />

                  <Input
                    value={row.demand}
                    onChange={(e) => setField(key, "demand", e.target.value)}
                    disabled={row.isReadOnly}
                    placeholder="Demand"
                  />

                  <Input
                    value={row.billedAmount}
                    onChange={(e) =>
                      setField(key, "billedAmount", e.target.value)
                    }
                    disabled={row.isReadOnly}
                    placeholder="Billed"
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>

        {hasEditableRows && (
          <Button disabled={saving} className="mt-4 w-full">
            {saving ? "Saving..." : "Save"}
          </Button>
        )}
      </form>
    </div>
  );
}