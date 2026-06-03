import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  CardHeader,
  CardTimestamp,
  AnimatedCard,
  ExpandRow,
} from "./shared-dashboard-ui";
import { fmtMonthLabel } from "@/lib/dashboard-utils";
import { DashboardStats } from "@/types/dashboard.types";

function ProcurementExpanded({ procurement }: { procurement: any }) {
  if (!procurement) return null;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
            Received
          </p>
          <p className="text-sm font-semibold">{procurement.received}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-amber-600 dark:text-amber-400">
            Pending
          </p>
          <p className="text-sm font-semibold">{procurement.pending}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-red-600 dark:text-red-400">Delayed</p>
          <p className="text-sm font-semibold">{procurement.delayed}</p>
        </div>
      </div>
    </div>
  );
}

const expandVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: { height: "auto", opacity: 1 },
};

export function ProcurementCard({
  active,
  index,
  procurement,
  timeLabel,
  dateLabel,
  basePath,
}: {
  active: boolean;
  index: number;
  procurement: DashboardStats["procurement"] | undefined;
  timeLabel: string;
  dateLabel: string;
  basePath?: string;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const total = procurement?.total_items ?? 0;
  const monthLabel = procurement?.month ? fmtMonthLabel(procurement.month) : "—";

  const openOrders = (procurement?.pending ?? 0) + (procurement?.delayed ?? 0);

  return (
    <AnimatedCard index={index}>
      <Card className={`transition-all hover:shadow-md ${active ? "border-primary" : ""}`}>
        <CardContent className="px-5 py-4 space-y-3">
          <div className="flex justify-between cursor-pointer" onClick={() => setExpanded((v) => !v)}>
            <CardHeader
              color="amber"
              icon={ShoppingCart}
              label="Procurement"
              summary={`${total} total items · ${monthLabel}`}
            />
            <div className="text-right">
              <p className="text-2xl font-bold">{openOrders}</p>
              <p className="text-xs text-muted-foreground">open purchase orders</p>
              <CardTimestamp timeLabel={timeLabel} dateLabel={dateLabel} />
            </div>
          </div>

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                key="procurement-expanded"
                variants={expandVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="pt-3 border-t border-border/50">
                  <ProcurementExpanded procurement={procurement} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <ExpandRow
            id="procurement"
            expanded={expanded}
            onToggle={() => setExpanded((v) => !v)}
            basePath={basePath}
          />
        </CardContent>
      </Card>
    </AnimatedCard>
  );
} 