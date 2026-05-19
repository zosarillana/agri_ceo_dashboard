"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

import { logService } from "@/services/maintenance.service";

import type {
  MaintenanceLog,
  MaintenanceLogByPlant,
} from "@/types/maintenance.types";

// ─────────────────────────────────────────────────────────────
// LOG ITEM (DARK MODE SAFE FIX)
// ─────────────────────────────────────────────────────────────

const LogItem = React.memo(
  ({ log, isNew }: { log: MaintenanceLog; isNew?: boolean }) => (
    <motion.div
      initial={
        isNew
          ? { opacity: 0, scale: 0.97 }
          : { opacity: 0, x: -20 }
      }
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "flex justify-between items-center border rounded-md px-3 py-2 text-xs transition-colors",
        "bg-background hover:bg-muted/50",
        isNew && "border-emerald-500/30 bg-emerald-500/5"
      )}
    >
      <div>
        <p className="font-medium text-foreground">
          {log.unit_name || "Unknown Unit"}
        </p>
        <p className="text-muted-foreground">
          {log.checked_by?.name || "Unknown User"}
        </p>
      </div>

      <div className="text-right space-y-1">
        <Badge className="text-xs">{log.status}</Badge>
        <p className="text-muted-foreground text-xs">
          {log.checked_at
            ? new Date(log.checked_at).toLocaleString()
            : "—"}
        </p>
      </div>
    </motion.div>
  )
);

LogItem.displayName = "LogItem";

// ─────────────────────────────────────────────────────────────
// LOADING SKELETON
// ─────────────────────────────────────────────────────────────

function LogsSkeleton() {
  return (
    <div className="space-y-3">
      <Card className="p-4 space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function MaintenanceLogForm() {
  const [selectedDate, setSelectedDate] = React.useState(
    new Date().toISOString().split("T")[0]
  );

  const [logs, setLogs] = React.useState<MaintenanceLogByPlant[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [newLogIds] = React.useState<Set<number>>(new Set());

  async function fetchLogs() {
    setLoading(true);
    try {
      const data = await logService.getByDate(selectedDate);
      setLogs(data || []);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    fetchLogs();
  }, [selectedDate]);

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <Card>
        <div className="p-4 flex justify-between flex-wrap gap-3 items-end">
          <div>
            <p className="text-sm font-medium">Maintenance History</p>
            <p className="text-xs text-muted-foreground">
              View all maintenance checks by date
            </p>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              Filter by Date
            </Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-[180px]"
            />
          </div>
        </div>
      </Card>

      {/* CONTENT */}
      <AnimatePresence mode="wait">
        {loading ? (
          <LogsSkeleton />
        ) : logs.length > 0 ? (
          <motion.div
            key="logs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {logs.map((group) => (
              <Card key={group.plant}>
                <div className="p-4 border-b bg-muted/30 font-semibold text-foreground">
                  {group.plant}
                </div>

                <div className="p-4 space-y-2">
                  {group.checks.map((log) => (
                    <LogItem
                      key={log.id}
                      log={log}
                      isNew={newLogIds.has(log.id)}
                    />
                  ))}
                </div>
              </Card>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-10 text-muted-foreground border rounded-lg bg-background">
            No logs found for{" "}
            {new Date(selectedDate).toLocaleDateString()}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}