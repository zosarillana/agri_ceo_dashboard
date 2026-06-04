import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Building2, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  CardHeader,
  CardTimestamp,
  AnimatedCard,
  ExpandRow,
} from "./shared-dashboard-ui";
import { fmt, fmtUSD } from "@/lib/dashboard-utils";
import { mockData } from "@/routes/auth/-data/-mock-data";
import { currentMonthKey } from "@/lib/dashboard-utils";

/* ─────────────────────────────────────────────
   DERIVE STATS FROM MOCK
───────────────────────────────────────────── */

function useTradeStats() {
  return React.useMemo(() => {
    const data = mockData.trading;

    const total_orders = data.length;

    const total_volume = data.reduce(
      (sum, t) => sum + (t.volumeIn ?? 0),
      0
    );

    /* ── CLASSIFICATION ── */

    const isExport = (t: any) =>
      t.name.toLowerCase().includes("fms") ||
      t.name.toLowerCase().includes("new asia");

    const isCWC = (t: any) =>
      t.name.toLowerCase().includes("dc") ||
      t.input.toLowerCase().includes("cake") ||
      t.input.toLowerCase().includes("desiccated");

    const export_orders = data.filter(isExport).length;
    const cwc_orders = data.filter(isCWC).length;

    const local_orders = data.filter(
      (t) => !isExport(t) && !isCWC(t)
    ).length;

    return {
      total_orders,
      total_volume,
      total_value: 0,
      avg_price: 0,
      export_orders,
      local_orders,
      cwc_orders,
      month: currentMonthKey(),
      has_data: true,
    };
  }, []);
}

/* ─────────────────────────────────────────────
   EXPANDED SECTION
───────────────────────────────────────────── */

function TradesExpanded({
  trades,
}: {
  trades: ReturnType<typeof useTradeStats>;
}) {
  const exportPct =
    trades.total_orders > 0
      ? Math.round((trades.export_orders / trades.total_orders) * 100)
      : 0;

  return (
    <div className="space-y-3">

      {/* ── 3 BOX GRID (NO ETC) ── */}
      <div className="grid grid-cols-3 gap-2">

        <div className="flex flex-col items-center p-2 rounded-md bg-blue-500/5 border border-blue-500/10">
          <Globe className="h-3.5 w-3.5 text-blue-500 mb-1" />
          <p className="text-[10px] text-muted-foreground uppercase font-medium">
            Export
          </p>
          <p className="text-sm font-bold">{trades.export_orders}</p>
        </div>

        <div className="flex flex-col items-center p-2 rounded-md bg-amber-500/5 border border-amber-500/10">
          <Building2 className="h-3.5 w-3.5 text-amber-500 mb-1" />
          <p className="text-[10px] text-muted-foreground uppercase font-medium">
            Local
          </p>
          <p className="text-sm font-bold">{trades.local_orders}</p>
        </div>

        <div className="flex flex-col items-center p-2 rounded-md bg-cyan-500/5 border border-cyan-500/10">
          <Package className="h-3.5 w-3.5 text-cyan-500 mb-1" />
          <p className="text-[10px] text-muted-foreground uppercase font-medium">
            CWC
          </p>
          <p className="text-sm font-bold">{trades.cwc_orders}</p>
        </div>
      </div>

      {/* ── EXPORT SHARE ── */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Export share</span>
          <span className="font-medium text-foreground">
            {exportPct}%
          </span>
        </div>

        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full bg-blue-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${exportPct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* ── METRICS ── */}
      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/30">

        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase font-medium">
            Avg. Price
          </p>
          <p className="text-sm font-semibold">
            {trades.avg_price
              ? `${fmtUSD(trades.avg_price)}/kg`
              : "—"}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase font-medium">
            Total Volume
          </p>
          <p className="text-sm font-semibold">
            {fmt(trades.total_volume)} kg
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN CARD
───────────────────────────────────────────── */

export function TradesCard({
  active,
  index,
  timeLabel,
  dateLabel,
  basePath,
}: {
  active: boolean;
  index: number;
  timeLabel: string;
  dateLabel: string;
  basePath?: string;
}) {
  const [expanded, setExpanded] = React.useState(false);

  const trades = useTradeStats();

  return (
    <AnimatedCard index={index}>
      <Card className={`transition-all hover:shadow-md ${active ? "border-primary" : ""}`}>
        <CardContent className="px-5 py-4 space-y-3">

          {/* HEADER */}
          <div
            className="flex justify-between cursor-pointer"
            onClick={() => setExpanded((v) => !v)}
          >
            <CardHeader
              color="blue"
              icon={Globe}
              label="Trading"
              summary={`${trades.total_orders} operations · ${fmt(
                trades.total_volume
              )} kg input`}
            />

            <div className="text-right">
              <p className="text-2xl font-bold">{trades.total_orders}</p>
              <p className="text-xs text-muted-foreground">
                active trade operations
              </p>
              <CardTimestamp
                timeLabel={timeLabel}
                dateLabel={dateLabel}
              />
            </div>
          </div>

          {/* EXPANDED */}
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                key="trades-expanded"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="overflow-hidden"
              >
                <div className="pt-3 border-t border-border/50">
                  <TradesExpanded trades={trades} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FOOTER */}
          <ExpandRow
            id="trading"
            expanded={expanded}
            onToggle={() => setExpanded((v) => !v)}
            basePath={basePath}
          />
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}