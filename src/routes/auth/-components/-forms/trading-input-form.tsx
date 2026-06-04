// src/routes/auth/-components/-forms/trading-input-form.tsx

"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  Globe,
  Building2,
  Package,
} from "lucide-react";

import { mockData } from "@/routes/auth/-data/-mock-data";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TradeRow {
  product_id: number;
  market: "Export" | "Local";
  counterparty: string;
  price_per_kg: number;
  quantity_kg: number;
  total_value: number;
  isReadOnly: boolean;
}

interface Product {
  id: number;
  name: string;
  unit?: string;
}

interface TradingInputFormProps {
  products: Product[];
  loading: boolean;
  onSaved: () => void;
}

// ─── MOCK TRADING SOURCE ─────────────────────────────────────────────────────

const mockTrades = mockData.trading;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayISO() {
  return new Date().toLocaleDateString("en-CA");
}



// ─── CORE ROW BUILDERS ───────────────────────────────────────────────────────


function populateRows(products: Product[]): Record<number, TradeRow> {
  const tradesMap = new Map(mockTrades.map((t, i) => [i + 1, t]));

  return Object.fromEntries(
    products.map((p, idx) => {
      const t = tradesMap.get(idx + 1);

      const hasData =
        t && (t.volumeIn > 0 || t.volumeOut > 0);

      return [
        p.id,
        {
          product_id: p.id,
          market: "Export",
          counterparty: t?.name ?? "",
          price_per_kg: 0,
          quantity_kg: t?.volumeIn ?? 0,
          total_value: 0,
          isReadOnly: !!hasData,
        },
      ];
    })
  );
}

// ─── BANNERS ──────────────────────────────────────────────────────────────────



// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function TradingInputForm({
  products,
}: TradingInputFormProps) {
  const today = getTodayISO();

  const [] = useState(today);
  const [, setRows] = useState<Record<number, TradeRow>>({});
  const [] = useState(false);
  const [] = useState<"idle" | "success" | "error">("idle");
  const [] = useState("");


  // ── INIT FROM MOCK ─────────────────────────────────────────────
  useEffect(() => {
    if (!products.length) return;
    setRows(populateRows(products));
  }, [products]);

  // ── CLASSIFICATION (NO ETC ANYMORE) ────────────────────────────

  function getType(t: any): "Export" | "Local" | "CWC" {
    const name = t.name.toLowerCase();
    const input = t.input.toLowerCase();

    if (name.includes("fms") || name.includes("new asia")) return "Export";
    if (input.includes("cake") || input.includes("desiccated")) return "CWC";
    return "Local";
  }

  const stats = mockTrades.reduce(
    (acc, t) => {
      const type = getType(t);
      acc[type.toLowerCase()]++;
      return acc;
    },
    { export: 0, local: 0, cwc: 0 } as Record<string, number>
  );


  // ── UI ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* HEADER */}
      <Card>
        <CardHeader>
          <CardTitle>Trading (Mock Data)</CardTitle>
          <CardDescription>
            Export / Local / CWC breakdown (no ETC)
          </CardDescription>
        </CardHeader>
      </Card>

      {/* STATS GRID */}
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

      {/* LIST */}
      <Card>
        <CardContent className="p-4 space-y-2">
          {mockTrades.map((t, i) => {
            const type = getType(t);

            return (
              <div
                key={i}
                className="flex justify-between border-b py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.input} → {t.output}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-semibold">
                    {t.volumeIn.toLocaleString()} kg
                  </p>
                  <Badge
                    variant={
                      type === "Export"
                        ? "default"
                        : type === "CWC"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {type}
                  </Badge>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}