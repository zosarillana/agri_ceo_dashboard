import { Globe } from "lucide-react";
import { DashCard } from "./shared-dashboard-ui";
import { fmt, fmtUSD } from "@/lib/dashboard-utils";

function TradesExpanded({ trades }: { trades: any }) {
  const exportPct =
    trades?.total_orders > 0
      ? Math.round((trades.export_orders / trades.total_orders) * 100)
      : 0;

  return (
    <div className="space-y-3">

      {/* GRID */}
      <div className="grid grid-cols-3 gap-2">

        <div className="flex flex-col items-center p-2 rounded-md bg-blue-500/5 border border-blue-500/10">
          <p className="text-[10px] text-muted-foreground uppercase font-medium">
            Export
          </p>
          <p className="text-sm font-bold">{trades?.export_orders ?? 0}</p>
        </div>

        <div className="flex flex-col items-center p-2 rounded-md bg-amber-500/5 border border-amber-500/10">
          <p className="text-[10px] text-muted-foreground uppercase font-medium">
            Local
          </p>
          <p className="text-sm font-bold">{trades?.local_orders ?? 0}</p>
        </div>

        <div className="flex flex-col items-center p-2 rounded-md bg-cyan-500/5 border border-cyan-500/10">
          <p className="text-[10px] text-muted-foreground uppercase font-medium">
            CWC
          </p>
          <p className="text-sm font-bold">{trades?.cwc_orders ?? 0}</p>
        </div>
      </div>

      {/* EXPORT SHARE */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Export share</span>
          <span className="font-medium text-foreground">
            {exportPct}%
          </span>
        </div>

        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${exportPct}%` }}
          />
        </div>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/30">

        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase font-medium">
            Avg. Price
          </p>
          <p className="text-sm font-semibold">
            {trades?.avg_price ? `${fmtUSD(trades.avg_price)}/kg` : "—"}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase font-medium">
            Total Volume
          </p>
          <p className="text-sm font-semibold">
            {trades?.total_volume ? `${fmt(trades.total_volume)} kg` : "—"}
          </p>
        </div>

      </div>
    </div>
  );
}

export function TradesCard({
  trades,
  active,
  index,
  timeLabel,
  dateLabel,
  basePath,
}: {
  trades: any;
  active: boolean;
  index: number;
  timeLabel: string;
  dateLabel: string;
  basePath?: string;
}) {

  const stat = trades?.total_orders ?? 0;

  const unit =
    trades?.total_volume
      ? `${fmt(trades.total_volume)} kg traded`
      : "no trades yet";

  return (
    <DashCard
      id="trading"
      color="blue"
      icon={Globe}
      label="Trading Activity"
      summary={`${stat} trade operations`}
      stat={stat}
      unit={unit}
      timeLabel={timeLabel}
      dateLabel={dateLabel}
      active={active}
      index={index}
      basePath={basePath}
      expandedContent={<TradesExpanded trades={trades} />}
    />
  );
}