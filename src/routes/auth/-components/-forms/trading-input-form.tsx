// src/routes/auth/-components/-forms/trading-input-form.tsx

"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe, Building2, Package, Save, Loader2 } from "lucide-react";
import { useTradingStore } from "@/store/trading.store";
import { TradeItem, Market, TradePayload } from "@/types/trading.types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TradeRow {
  trade_item_id: number;
  market: Market;
  counterparty: string;
  price_per_kg: number;
  quantity_kg: number;
}

interface TradingInputFormProps {
  tradeItems: TradeItem[];
  loading: boolean;
  onSaved: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayISO() {
  return new Date().toLocaleDateString("en-CA");
}

function initRows(tradeItems: TradeItem[]): Record<number, TradeRow> {
  return Object.fromEntries(
    tradeItems.map((item) => [
      item.id,
      {
        trade_item_id: item.id,
        market:        (item.market as Market) ?? "Export",
        counterparty:  "",
        price_per_kg:  0,
        quantity_kg:   0,
      },
    ])
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TradingInputForm({
  tradeItems,
  loading,
  onSaved,
}: TradingInputFormProps) {
  const today = getTodayISO();

  const [tradeDate, setTradeDate] = useState(today);
  const [rows, setRows] = useState<Record<number, TradeRow>>(() =>
    initRows(tradeItems)
  );
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const { saveTrades, saving } = useTradingStore();

  // Re-init rows when tradeItems load in
  const [prevItems, setPrevItems] = useState(tradeItems);
  if (tradeItems !== prevItems) {
    setPrevItems(tradeItems);
    setRows(initRows(tradeItems));
  }

  // ── Row update helpers ─────────────────────────────────────────────────────

  function updateRow(id: number, field: keyof TradeRow, value: any) {
    setRows((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  }

  // ── Stats ──────────────────────────────────────────────────────────────────

  const stats = tradeItems.reduce(
    (acc, item) => {
      const market = (item.market ?? "Export").toLowerCase();
      if (market === "export") acc.export++;
      else if (market === "local") acc.local++;
      else if (market === "cwc") acc.cwc++;
      return acc;
    },
    { export: 0, local: 0, cwc: 0 }
  );

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    const payload: TradePayload[] = Object.values(rows)
      .filter((r) => r.quantity_kg > 0 || r.price_per_kg > 0)
      .map((r) => ({
        trade_item_id: r.trade_item_id,
        market:        r.market,
        counterparty:  r.counterparty || null,
        price_per_kg:  r.price_per_kg,
        quantity_kg:   r.quantity_kg,
      }));

    if (!payload.length) {
      setStatus("error");
      setErrorMsg("Please enter at least one trade with volume or price.");
      return;
    }

    try {
      setStatus("idle");
      setErrorMsg("");
      await saveTrades(payload, tradeDate);
      setStatus("success");
      onSaved();
    } catch {
      setStatus("error");
      setErrorMsg("Failed to save trades. Please try again.");
    }
  }

  // ── UI ─────────────────────────────────────────────────────────────────────

  if (loading && !tradeItems.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Loading trade items…
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Trade Input</CardTitle>
          <CardDescription>
            Enter volumes and prices per trade item for a given date.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-muted-foreground">
              Trade Date
            </label>
            <Input
              type="date"
              value={tradeDate}
              onChange={(e) => setTradeDate(e.target.value)}
              className="w-44"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-500" />
              Export
            </span>
            <b>{stats.export}</b>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-amber-500" />
              Local
            </span>
            <b>{stats.local}</b>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Package className="h-4 w-4 text-cyan-500" />
              CWC
            </span>
            <b>{stats.cwc}</b>
          </CardContent>
        </Card>
      </div>

      {/* Error / Success banners */}
      {status === "error" && (
        <div className="px-4 py-2 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {errorMsg}
        </div>
      )}
      {status === "success" && (
        <div className="px-4 py-2 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          Trades saved successfully.
        </div>
      )}

      {/* Trade rows */}
      <Card>
        <CardContent className="p-4 space-y-3">
          {tradeItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No trade items found. Add trade items first.
            </p>
          ) : (
            tradeItems.map((item) => {
              const row = rows[item.id];
              if (!row) return null;

              return (
                <div
                  key={item.id}
                  className="border rounded-lg p-3 space-y-3"
                >
                  {/* Item header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.input ?? "—"} → {item.output ?? "—"}
                      </p>
                    </div>
                    <Badge
                      variant={
                        row.market === "Export"
                          ? "default"
                          : row.market === "CWC"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {row.market}
                    </Badge>
                  </div>

                  {/* Input fields */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">
                        Market
                      </label>
                      <Select
                        value={row.market}
                        onValueChange={(v) =>
                          updateRow(item.id, "market", v as Market)
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Export">Export</SelectItem>
                          <SelectItem value="Local">Local</SelectItem>
                          <SelectItem value="CWC">CWC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">
                        Counterparty
                      </label>
                      <Input
                        className="h-8 text-xs"
                        placeholder="e.g. FMS International"
                        value={row.counterparty}
                        onChange={(e) =>
                          updateRow(item.id, "counterparty", e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">
                        Price / kg
                      </label>
                      <Input
                        className="h-8 text-xs"
                        type="number"
                        min={0}
                        step={0.0001}
                        placeholder="0.0000"
                        value={row.price_per_kg || ""}
                        onChange={(e) =>
                          updateRow(
                            item.id,
                            "price_per_kg",
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">
                        Quantity (kg)
                      </label>
                      <Input
                        className="h-8 text-xs"
                        type="number"
                        min={0}
                        step={0.0001}
                        placeholder="0.0000"
                        value={row.quantity_kg || ""}
                        onChange={(e) =>
                          updateRow(
                            item.id,
                            "quantity_kg",
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                  </div>

                  {/* Live total */}
                  {row.price_per_kg > 0 && row.quantity_kg > 0 && (
                    <p className="text-xs text-muted-foreground text-right">
                      Total:{" "}
                      <span className="font-semibold text-foreground">
                        {(row.price_per_kg * row.quantity_kg).toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                        )}
                      </span>
                    </p>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Save button */}
      {tradeItems.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={saving} className="gap-2">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving…" : "Save Trades"}
          </Button>
        </div>
      )}
    </div>
  );
}