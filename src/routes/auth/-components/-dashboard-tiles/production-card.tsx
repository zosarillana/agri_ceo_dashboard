import * as React from "react";
import { format } from "date-fns";
import { Factory } from "lucide-react";
import { DashCard } from "./shared-dashboard-ui";
import { fmt } from "@/lib/dashboard-utils";

function ProductionExpanded({ production }: { production: any }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Today</p>
          <p className="text-sm font-semibold">{production?.today_production_output ? fmt(production.today_production_output) : "—"}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Yesterday</p>
          <p className="text-sm font-semibold">{production?.yesterday_production_output ? fmt(production.yesterday_production_output) : "—"}</p>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground">6 product lines running</p>
    </div>
  );
}

export function ProductionCard({ 
  production, 
  loading, 
  isToday, 
  selectedISO, 
  active,
  basePath
}: { 
  production: any; 
  loading: boolean; 
  isToday: boolean; 
  selectedISO: string; 
  active: boolean; 
  basePath?: string;
}) {
  const stat = loading ? "—" : production?.today_production_output
    ? fmt(production.today_production_output)
    : production?.yesterday_production_output && isToday
      ? `${fmt(production.yesterday_production_output)} (yesterday)`
      : "No data";

  const unit = isToday ? "units today" : `units on ${format(new Date(selectedISO + "T00:00:00"), "MMM d")}`;
  const timeLabel = production?.last_updated_at ? format(new Date(production.last_updated_at), "HH:mm") : "—";
  const dateLabel = production?.last_updated_at ? format(new Date(production.last_updated_at), "MMM d") : "—";

  return (
    <DashCard
      id="production" color="teal" icon={Factory} label="Production Output"
      summary="6 product lines running" stat={stat} unit={unit}
      timeLabel={timeLabel} dateLabel={dateLabel} active={active} index={0}
      basePath={basePath}
      expandedContent={<ProductionExpanded production={production} />}
    />
  );
}