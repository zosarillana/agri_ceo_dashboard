// src/routes/auth/-components/-forms/trading-input-form.tsx

"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { CalendarIcon, Search, Edit, Trash2, Filter } from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Globe, Building2, Save, Loader2 } from "lucide-react";
import { useTradingStore } from "@/store/trading.store";
import { TradeItem, Market, TradePayload } from "@/types/trading.types";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TradeRow {
  trade_item_id: number;
  market: Market;
  counterparty: string;
  input_kg: number;
  output_kg: number;
  existing_trade_id?: number;
  is_editing?: boolean;
  original_data?: {
    market: Market;
    counterparty: string;
    input_kg: number;
    output_kg: number;
  };
}

interface TradingInputFormProps {
  tradeItems: TradeItem[];
  loading: boolean;
  onSaved: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initRows(tradeItems: TradeItem[]): Record<number, TradeRow> {
  return Object.fromEntries(
    tradeItems.map((item) => [
      item.id,
      {
        trade_item_id: item.id,
        market: (item.market as Market) ?? "Export",
        counterparty: "",
        input_kg: 0,
        output_kg: 0,
        is_editing: false,
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
  const [tradeDate, setTradeDate] = useState<Date>(() => new Date());
  const [rows, setRows] = useState<Record<number, TradeRow>>(() =>
    initRows(tradeItems)
  );
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [showExistingData, setShowExistingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [, setCurrentDate] = useState<string>("");

  const { 
    saveTrades, 
    saving, 
    trades, 
    loading: tradesLoading,
    fetchLatest,
    deleteTrade,
    updateTrade,
  } = useTradingStore();

  // Re-init rows when tradeItems load in
  const [prevItems, setPrevItems] = useState(tradeItems);
  if (tradeItems !== prevItems) {
    setPrevItems(tradeItems);
    setRows(initRows(tradeItems));
  }

  // ── Fetch trades when date changes ──────────────────────────────────────

  useEffect(() => {
    if (tradeDate) {
      const formattedDate = format(tradeDate, "yyyy-MM-dd");
      setCurrentDate(formattedDate);
      fetchLatest(formattedDate, formattedDate);
    }
  }, [tradeDate, fetchLatest]);

  // ── Populate rows with existing trade data when fetched ──────────────

  useEffect(() => {
    // Reset rows to empty state first
    const newRows = initRows(tradeItems);
    
    if (trades.length > 0 && showExistingData) {
      // Populate with existing trades
      trades.forEach((trade) => {
        if (newRows[trade.trade_item_id]) {
          newRows[trade.trade_item_id] = {
            ...newRows[trade.trade_item_id],
            market: trade.market,
            counterparty: trade.counterparty || "",
            input_kg: trade.input_kg,
            output_kg: trade.output_kg,
            existing_trade_id: trade.id,
            is_editing: false,
            original_data: {
              market: trade.market,
              counterparty: trade.counterparty || "",
              input_kg: trade.input_kg,
              output_kg: trade.output_kg,
            },
          };
        }
      });
    }
    
    setRows(newRows);
  }, [trades, showExistingData, tradeItems]);

  // ── Row update helpers ─────────────────────────────────────────────────────

  function updateRow(id: number, field: keyof TradeRow, value: any) {
    setRows((prev) => ({
      ...prev,
      [id]: { 
        ...prev[id], 
        [field]: value,
        is_editing: prev[id].existing_trade_id ? true : prev[id].is_editing
      },
    }));
  }

  // ── Filter trades based on search ────────────────────────────────────────

  const filteredTradeItems = useMemo(() => {
    if (!searchTerm) return tradeItems;
    return tradeItems.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.input?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.output?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tradeItems, searchTerm]);

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
    const formattedDate = format(tradeDate, "yyyy-MM-dd");
    
    const newTrades: TradePayload[] = [];
    const updateTrades: { id: number; data: TradePayload }[] = [];
    
    Object.values(rows).forEach((r) => {
      if (r.input_kg === 0 && r.output_kg === 0) return;
      
      const tradeData = {
        trade_item_id: r.trade_item_id,
        market: r.market,
        counterparty: r.counterparty || null,
        input_kg: r.input_kg,
        output_kg: r.output_kg,
      };
      
      if (r.existing_trade_id && !r.is_editing) {
        return;
      } else if (r.existing_trade_id && r.is_editing) {
        updateTrades.push({
          id: r.existing_trade_id,
          data: tradeData,
        });
      } else {
        newTrades.push(tradeData);
      }
    });

    if (!newTrades.length && !updateTrades.length) {
      setStatus("error");
      setErrorMsg("Please enter at least one trade with input or output volume.");
      return;
    }

    try {
      setStatus("idle");
      setErrorMsg("");
      
      for (const update of updateTrades) {
        await updateTrade(update.id, update.data);
      }
      
      if (newTrades.length) {
        await saveTrades(newTrades, formattedDate);
      }
      
      setStatus("success");
      setErrorMsg(`Trades saved successfully for ${format(tradeDate, "PPP")}.`);
      
      onSaved();
      await fetchLatest(formattedDate, formattedDate);
      
    } catch (error) {
      console.error("Save error:", error);
      setStatus("error");
      setErrorMsg("Failed to save trades. Please try again.");
    }
  }

  // ── Delete existing trade ─────────────────────────────────────────────────

  async function handleDeleteTrade(tradeId: number, _tradeItemId: number) {
    if (!confirm("Are you sure you want to delete this trade?")) return;
    
    try {
      await deleteTrade(tradeId);
      setStatus("success");
      setErrorMsg("Trade deleted successfully.");
      
      const formattedDate = format(tradeDate, "yyyy-MM-dd");
      await fetchLatest(formattedDate, formattedDate);
    } catch (error) {
      console.error("Delete error:", error);
      setStatus("error");
      setErrorMsg("Failed to delete trade.");
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

      {/* Header with Date Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Trade Input</CardTitle>
          <CardDescription>
            Enter input and output volumes per trade item for a given date.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">
                Trade Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !tradeDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {tradeDate ? format(tradeDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={tradeDate}
                    onSelect={(date) => {
                      if (date) {
                        setTradeDate(date);
                        setShowExistingData(true);
                        // Reset status messages when changing date
                        setStatus("idle");
                        setErrorMsg("");
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant={showExistingData ? "default" : "outline"}
                size="sm"
                onClick={() => setShowExistingData(!showExistingData)}
                className="gap-2"
              >
                <Filter className="h-3 w-3" />
                {showExistingData ? "Hide Existing" : "Show Existing"}
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search trade items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Existing trades info */}
          {tradesLoading ? (
            <div className="mt-2 text-sm text-muted-foreground">Loading trades...</div>
          ) : trades.length > 0 && showExistingData ? (
            <div className="mt-2 text-sm text-muted-foreground">
              Found {trades.length} existing trade(s) for {format(tradeDate, "PPP")}
            </div>
          ) : trades.length === 0 && showExistingData && (
            <div className="mt-2 text-sm text-muted-foreground">
              No existing trades found for {format(tradeDate, "PPP")}. Enter new trades below.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
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
        {/* <Card>
          <CardContent className="p-3 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Package className="h-4 w-4 text-cyan-500" />
              CWC
            </span>
            <b>{stats.cwc}</b>
          </CardContent>
        </Card> */}
      </div>

      {/* Error / Success banners */}
      {status === "error" && (
        <div className="px-4 py-2 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {errorMsg}
        </div>
      )}
      {status === "success" && (
        <div className="px-4 py-2 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Trade rows */}
      <Card>
        <CardContent className="p-4 space-y-3">
          {filteredTradeItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {searchTerm ? "No trade items match your search." : "No trade items found. Add trade items first."}
            </p>
          ) : (
            filteredTradeItems.map((item) => {
              const row = rows[item.id];
              if (!row) return null;

              const hasExistingData = !!row.existing_trade_id;
              const isEditing = row.is_editing || !hasExistingData;
              const hasChanges = hasExistingData && isEditing;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "border rounded-lg p-3 space-y-3 transition-colors",
                    hasExistingData && !isEditing ? "bg-muted/30" : "bg-card",
                    hasChanges && "border-primary/50"
                  )}
                >
                  {/* Item header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{item.name}</p>
                        {hasExistingData && !isEditing && (
                          <Badge variant="secondary" className="text-xs">
                            Existing
                          </Badge>
                        )}
                        {hasChanges && (
                          <Badge variant="default" className="text-xs">
                            Editing
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.input ?? "—"} → {item.output ?? "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasExistingData && (
                        <>
                          {!isEditing ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setRows((prev) => ({
                                  ...prev,
                                  [item.id]: { ...prev[item.id], is_editing: true }
                                }));
                              }}
                              className="h-7 gap-1"
                            >
                              <Edit className="h-3 w-3" />
                              Edit
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const original = row.original_data;
                                if (original) {
                                  setRows((prev) => ({
                                    ...prev,
                                    [item.id]: {
                                      ...prev[item.id],
                                      market: original.market,
                                      counterparty: original.counterparty,
                                      input_kg: original.input_kg,
                                      output_kg: original.output_kg,
                                      is_editing: false,
                                    }
                                  }));
                                }
                              }}
                              className="h-7 gap-1 text-red-500 hover:text-red-700"
                            >
                              Cancel
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTrade(row.existing_trade_id!, item.id)}
                            className="h-7 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
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
                  </div>

                  {/* Input fields - now always editable for new data */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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

                    {/* <div className="space-y-1">
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
                    </div> */}

                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">
                        Input (kg)
                      </label>
                      <Input
                        className="h-8 text-xs"
                        type="number"
                        min={0}
                        step={0.0001}
                        placeholder="0.0000"
                        value={row.input_kg || ""}
                        onChange={(e) =>
                          updateRow(
                            item.id,
                            "input_kg",
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">
                        Output (kg)
                      </label>
                      <Input
                        className="h-8 text-xs"
                        type="number"
                        min={0}
                        step={0.0001}
                        placeholder="0.0000"
                        value={row.output_kg || ""}
                        onChange={(e) =>
                          updateRow(
                            item.id,
                            "output_kg",
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                  </div>

                  {/* Live yield (output as a % of input) */}
                  {row.input_kg > 0 && row.output_kg > 0 && (
                    <p className="text-xs text-muted-foreground text-right">
                      Yield:{" "}
                      <span className="font-semibold text-foreground">
                        {((row.output_kg / row.input_kg) * 100).toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                        )}
                        %
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
      {filteredTradeItems.length > 0 && (
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