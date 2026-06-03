import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeftRight, Globe, Building2, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  CardHeader,
  CardTimestamp,
  AnimatedCard,
  ExpandRow,
} from "./shared-dashboard-ui";
import { fmt, fmtUSD } from "@/lib/dashboard-utils";
import { DashboardStats } from "@/types/dashboard.types";

function TradesExpanded({ trades }: { trades: DashboardStats["trades"] }) {
  if (!trades) return null;

  const exportPct =
    trades.total_orders > 0
      ? Math.round((trades.export_orders / trades.total_orders) * 100)
      : 0;

  return (
    <div className="space-y-3">
      {/* Export / Local / Avg Price — 3-box grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center p-2 rounded-md bg-blue-500/5 border border-blue-500/10">
          <Globe className="h-3.5 w-3.5 text-blue-500 mb-1" />
          <p className="text-[10px] text-muted-foreground uppercase font-medium">Export</p>
          <p className="text-sm font-bold">{trades.export_orders}</p>
        </div>
        <div className="flex flex-col items-center p-2 rounded-md bg-amber-500/5 border border-amber-500/10">
          <Building2 className="h-3.5 w-3.5 text-amber-500 mb-1" />
          <p className="text-[10px] text-muted-foreground uppercase font-medium">Local</p>
          <p className="text-sm font-bold">{trades.local_orders}</p>
        </div>
        <div className="flex flex-col items-center p-2 rounded-md bg-emerald-500/5 border border-emerald-500/10">
          <Package className="h-3.5 w-3.5 text-emerald-500 mb-1" />
          <p className="text-[10px] text-muted-foreground uppercase font-medium">Volume</p>
          <p className="text-sm font-bold">{fmt(trades.total_volume)} kg</p>
        </div>
      </div>

      {/* Export share progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Export share</span>
          <span className="font-medium text-foreground">{exportPct}%</span>
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

      {/* Avg price + total volume row */}
      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/30">
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
            Avg. Price
          </p>
          <p className="text-sm font-semibold">
            {trades.avg_price != null ? `${fmtUSD(trades.avg_price)}/kg` : "—"}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
            Total Input
          </p>
          <p className="text-sm font-semibold">{fmt(trades.total_volume)} kg</p>
        </div>
      </div>
    </div>
  );
}

const expandVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: { height: "auto", opacity: 1 },
};

export function TradesCard({
  active,
  index,
  trades,
  timeLabel,
  dateLabel,
  basePath,
}: {
  active: boolean;
  index: number;
  trades: DashboardStats["trades"] | undefined;
  timeLabel: string;
  dateLabel: string;
  basePath?: string;
}) {
  const [expanded, setExpanded] = React.useState(false);

  const orderCount = trades?.total_orders ?? 0;
  const totalVolume = trades?.total_volume ?? 0;

  return (
    <AnimatedCard index={index}>
      <Card className={`transition-all hover:shadow-md ${active ? "border-primary" : ""}`}>
        <CardContent className="px-5 py-4 space-y-3">
          <div
            className="flex justify-between cursor-pointer"
            onClick={() => setExpanded((v) => !v)}
          >
            <CardHeader
              color="blue"
              icon={ArrowLeftRight}
              label="Trading"
              summary={`${orderCount} operations · ${fmt(totalVolume)} kg input`}
            />
            <div className="text-right">
              <p className="text-2xl font-bold">{orderCount}</p>
              <p className="text-xs text-muted-foreground">active trade operations</p>
              <CardTimestamp timeLabel={timeLabel} dateLabel={dateLabel} />
            </div>
          </div>

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                key="trades-expanded"
                variants={expandVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="pt-3 border-t border-border/50">
                  <TradesExpanded trades={trades!} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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