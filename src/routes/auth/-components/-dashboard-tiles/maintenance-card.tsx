import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CardHeader, 
  CardTimestamp, 
  AnimatedCard, 
  ExpandRow,
  StatusPill
} from "./shared-dashboard-ui";

const expandVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: { height: "auto", opacity: 1 },
};

const STATUS_ORDER = ["operational", "maintenance", "standby", "down"] as const;

export function MaintenanceCard({
  active,
  index,
  checkedToday,
  totalUnits,
  completion,
  statusBreakdown,
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