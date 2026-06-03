import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  CardHeader,
  CardTimestamp,
  AnimatedCard,
  ExpandRow,
} from "./shared-dashboard-ui";

const STATUS_STYLES: Record<string, { dot: string; bg: string; text: string }> =
  {
    operational: {
      dot: "bg-emerald-500",
      bg: "bg-emerald-500/10",
      text: "text-emerald-700 dark:text-emerald-400",
    },
    maintenance: {
      dot: "bg-amber-500",
      bg: "bg-amber-500/10",
      text: "text-amber-700 dark:text-amber-400",
    },
    standby: {
      dot: "bg-blue-500",
      bg: "bg-blue-500/10",
      text: "text-blue-700 dark:text-blue-400",
    },
    down: {
      dot: "bg-red-500",
      bg: "bg-red-500/10",
      text: "text-red-700 dark:text-red-400",
    },
  };

const STATUS_ORDER = ["operational", "maintenance", "standby", "down"] as const;

function StatusPill({ status, count }: { status: string; count: number }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.standby;
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${s.bg}`}>
      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
      <span className={`text-xs font-medium capitalize ${s.text}`}>
        {status}
      </span>
      <span className={`text-xs font-bold ${s.text}`}>{count}</span>
    </div>
  );
}

const expandVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: { height: "auto", opacity: 1 },
};

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
      <Card
        className={`transition-all hover:shadow-md ${active ? "border-primary" : ""}`}
      >
        <CardContent className="px-5 py-4 space-y-3">
          <div
            className="flex justify-between cursor-pointer"
            onClick={() => setExpanded((v) => !v)}
          >
            <CardHeader
              color="red"
              icon={Wrench}
              label="Maintenance"
              summary={`${completion}% completion today`}
            />
            <div className="text-right pb-5">
              <p className="text-2xl font-bold">
                {checkedToday}/{totalUnits}
              </p>
              <p className="text-xs text-muted-foreground">units checked today</p>
              <CardTimestamp timeLabel={timeLabel} dateLabel={dateLabel} />
            </div>
          </div>

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                key="maintenance-expanded"
                variants={expandVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="pt-3 border-t border-border/50 space-y-3">
                  {/* Completion progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Daily Completion</span>
                      <span className="font-medium text-foreground">
                        {completion}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full bg-emerald-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${completion}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  {/* Status pills in fixed order */}
                  <div className="pt-1 grid grid-cols-2 gap-2">
                    {STATUS_ORDER.map((s) => (
                      <StatusPill
                        key={s}
                        status={s}
                        count={statusBreakdown?.[s] ?? 0}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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