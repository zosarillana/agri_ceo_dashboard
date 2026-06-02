import * as React from "react";
import { Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CardHeader, 
  CardTimestamp, 
  AnimatedCard, 
  ExpandRow
} from "./shared-dashboard-ui";

export function MaintenanceCard({
  active,
  index,
  checkedToday,
  totalUnits,
  completion,
  timeLabel,
  dateLabel,
  basePath,
}: {
  active: boolean;
  index: number;
  checkedToday: number;
  totalUnits: number;
  completion: number;
  statusBreakdown: Record<string, number> | undefined;
  timeLabel: string;
  dateLabel: string;
  basePath?: string;
}) {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <AnimatedCard index={index}>
      <Card className={`transition-all hover:shadow-md ${active ? "border-primary" : ""}`}>
        <CardContent className="px-5 py-4 space-y-3">
          <div className="flex justify-between cursor-pointer" onClick={() => setExpanded((v) => !v)}>
            <CardHeader color="red" icon={Wrench} label="Maintenance" summary={`${completion}% completion today`} />
            <div className="text-right pb-5">
              <p className="text-2xl font-bold">{checkedToday}/{totalUnits}</p>
              <p className="text-xs text-muted-foreground">units checked today</p>
              <CardTimestamp timeLabel={timeLabel} dateLabel={dateLabel} />
            </div>
          </div>
          {/* ... expanded content and footer row ... */}
          <ExpandRow
            id="maintenance"
            expanded={expanded}
            onToggle={() => setExpanded((v) => !v)}
            basePath={basePath}
          />
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}