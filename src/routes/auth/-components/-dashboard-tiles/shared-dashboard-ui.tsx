import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Calendar as CalendarIcon, ChevronDown, ExternalLink, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES & CONSTANTS
───────────────────────────────────────────────────────────────────────────── */

export type SegmentColor = "teal" | "amber" | "green" | "purple" | "blue" | "coral" | "pink" | "red";

export const COLOR_MAP: Record<SegmentColor, { bg: string; icon: string }> = {
  teal: { bg: "bg-teal-500/10", icon: "text-teal-700 dark:text-teal-400" },
  amber: { bg: "bg-amber-500/10", icon: "text-amber-700 dark:text-amber-400" },
  green: { bg: "bg-green-500/10", icon: "text-green-700 dark:text-green-400" },
  purple: { bg: "bg-purple-500/10", icon: "text-purple-700 dark:text-purple-400" },
  blue: { bg: "bg-blue-500/10", icon: "text-blue-700 dark:text-blue-400" },
  coral: { bg: "bg-orange-500/10", icon: "text-orange-700 dark:text-orange-400" },
  pink: { bg: "bg-pink-500/10", icon: "text-pink-700 dark:text-pink-400" },
  red: { bg: "bg-red-500/10", icon: "text-red-700 dark:text-red-400" },
};

export const STATUS_STYLES: Record<string, { dot: string; bg: string; text: string }> = {
  operational: { dot: "bg-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400" },
  maintenance: { dot: "bg-amber-500", bg: "bg-amber-500/10", text: "text-amber-700 dark:text-amber-400" },
  standby: { dot: "bg-blue-500", bg: "bg-blue-500/10", text: "text-blue-700 dark:text-blue-400" },
  down: { dot: "bg-red-500", bg: "bg-red-500/10", text: "text-red-700 dark:text-red-400" },
};

const expandVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: { height: "auto", opacity: 1 },
};

/* ─────────────────────────────────────────────────────────────────────────────
   COMPONENTS
───────────────────────────────────────────────────────────────────────────── */

export function StatusPill({ status, count }: { status: string; count: number }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.standby;
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${s.bg}`}>
      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
      <span className={`text-xs font-medium capitalize ${s.text}`}>{status}</span>
      <span className={`text-xs font-bold ${s.text}`}>{count}</span>
    </div>
  );
}

export function CardTimestamp({ timeLabel, dateLabel }: { timeLabel: string; dateLabel: string }) {
  return (
    <div className="flex gap-1 mt-1 justify-end">
      <span className="text-[10px] px-2 py-0.5 rounded bg-muted">{timeLabel}</span>
      <span className="text-[10px] text-muted-foreground">{dateLabel}</span>
    </div>
  );
}

export function HistoricalBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400">
      <CalendarIcon className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}

export function SampleBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border/60">
      Sample data · API coming soon
    </span>
  );
}

export function MockRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className="text-xs font-semibold">{value}</span>
    </div>
  );
}

export function CardHeader({
  color,
  icon: Icon,
  label,
  summary,
}: {
  color: SegmentColor;
  icon: React.ElementType;
  label: string;
  summary: string;
}) {
  const { bg, icon: iconColor } = COLOR_MAP[color];
  return (
    <div className="flex gap-3 text-left">
      <div className={`shrink-0 h-9 w-9 rounded-lg ${bg} flex items-center justify-center`}>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <div>
        <p className="font-semibold text-lg leading-tight">{label}</p>
        <p className="text-xs text-muted-foreground">{summary}</p>
      </div>
    </div>
  );
}

export function ExpandRow({
  id,
  expanded,
  onToggle,
  basePath = "/auth/admin/dashboard"
}: {
  id: string;
  expanded: boolean;
  onToggle: () => void;
  basePath?: string;
}) {
  return (
    <div className="flex items-center justify-between pt-2 border-t border-border/40 mt-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="inline-flex"
        >
          <ChevronDown className="h-3 w-3" />
        </motion.span>
        {expanded ? "Collapse" : "Expand"}
      </button>
      <Link
        to={`${basePath}/${id}` as any}
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <ExternalLink className="h-3 w-3" />
        Open
      </Link>
    </div>
  );
}

export function DashCard({
  id, color, label, icon, summary, stat, unit,
  timeLabel, dateLabel, active, index, expandedContent, basePath
}: {
  id: string;
  color: SegmentColor;
  label: string;
  icon: React.ElementType;
  summary: string;
  stat: string;
  unit: string;
  timeLabel: string;
  dateLabel: string;
  active: boolean;
  index: number;
  expandedContent?: React.ReactNode;
  basePath?: string;
}) {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <AnimatedCard index={index}>
      <Card className={`transition-all hover:shadow-md ${active ? "border-primary" : ""}`}>
        <CardContent className="px-5 py-4">
          <div className="flex justify-between cursor-pointer" onClick={() => setExpanded((v) => !v)}>
            <CardHeader color={color} icon={icon} label={label} summary={summary} />
            <div className="text-right">
              <p className="text-2xl font-bold">{stat}</p>
              <p className="text-xs text-muted-foreground">{unit}</p>
              <CardTimestamp timeLabel={timeLabel} dateLabel={dateLabel} />
            </div>
          </div>
          <AnimatePresence initial={false}>
            {expanded && expandedContent && (
              <motion.div
                key="expanded"
                variants={expandVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="pt-3 mt-2 border-t border-border/50">{expandedContent}</div>
              </motion.div>
            )}
          </AnimatePresence>
          <ExpandRow id={id} expanded={expanded} onToggle={() => setExpanded((v) => !v)} basePath={basePath} />
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}

export function StubCard({
  id, color, label, icon, summary, stat, unit,
  index, expandedContent, active, basePath
}: {
  id: string;
  color: SegmentColor;
  label: string;
  icon: React.ElementType;
  summary: string;
  stat: string;
  unit: string;
  index: number;
  expandedContent: React.ReactNode;
  active: boolean;
  basePath?: string;
}) {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <AnimatedCard index={index}>
      <Card className={`transition-all hover:shadow-md border-dashed ${active ? "border-primary" : ""}`}>
        <CardContent className="px-5 py-4">
          <div className="flex justify-between cursor-pointer" onClick={() => setExpanded((v) => !v)}>
            <CardHeader color={color} icon={icon} label={label} summary={summary} />
            <div className="text-right">
              <p className="text-2xl font-bold text-muted-foreground">{stat}</p>
              <p className="text-xs text-muted-foreground">{unit}</p>
              <CardTimestamp timeLabel="Sample" dateLabel="mock" />
            </div>
          </div>
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                key="stub-expanded"
                variants={expandVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="pt-3 mt-2 border-t border-border/50 space-y-3">
                  <SampleBadge />
                  {expandedContent}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <ExpandRow id={id} expanded={expanded} onToggle={() => setExpanded((v) => !v)} basePath={basePath} />
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}

export function AnimatedCard({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ y: -2, scale: 1.003 }}
    >
      {children}
    </motion.div>
  );
}