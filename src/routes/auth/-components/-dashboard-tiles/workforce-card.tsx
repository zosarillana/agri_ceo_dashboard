import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CardHeader, 
  CardTimestamp, 
  AnimatedCard, 
  ExpandRow 
} from "./shared-dashboard-ui";
import { WorkforceStats } from "@/types/dashboard.types";

const expandVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: { height: "auto", opacity: 1 },
};

export function WorkforceCard({
  active,
  index,
  workforce,
  timeLabel,
  dateLabel,
}: {
  active: boolean;
  index: number;
  workforce: WorkforceStats | undefined;
  timeLabel: string;
  dateLabel: string;
}) {
  const [expanded, setExpanded] = React.useState(false);

  if (!workforce) {
    return (
      <AnimatedCard index={index}>
        <Card className={`transition-all hover:shadow-md ${active ? "border-primary" : ""}`}>
          <CardContent className="px-5 py-4">
            <div className="flex justify-between">
              <CardHeader
                color="pink"
                icon={Users}
                label="Workforce"
                summary="Loading workforce data..."
              />
              <div className="text-right">
                <p className="text-2xl font-bold text-muted-foreground">—</p>
                <p className="text-xs text-muted-foreground">present today</p>
                <CardTimestamp timeLabel="—" dateLabel="—" />
              </div>
            </div>
          </CardContent>
        </Card>
      </AnimatedCard>
    );
  }

  const absentCount = workforce.total_headcount - workforce.total_present;
  const attendanceRate = workforce.attendance_rate ?? 0;

  return (
    <AnimatedCard index={index}>
      <Card className={`transition-all hover:shadow-md ${active ? "border-primary" : ""}`}>
        <CardContent className="px-5 py-4 space-y-3">
          <div className="flex justify-between cursor-pointer" onClick={() => setExpanded((v) => !v)}>
            <CardHeader color="pink" icon={Users} label="Workforce" summary={`${attendanceRate}% attendance · ${workforce.total_incidents} incidents`} />
            <div className="text-right">
              <p className="text-2xl font-bold">{workforce.total_present}/{workforce.total_headcount}</p>
              <p className="text-xs text-muted-foreground">present today</p>
              <CardTimestamp timeLabel={timeLabel} dateLabel={dateLabel} />
            </div>
          </div>

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                key="workforce-expanded"
                variants={expandVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="pt-3 border-t border-border/50 space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Attendance Rate</span>
                      <span className="font-medium text-foreground">{attendanceRate}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full bg-emerald-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${attendanceRate}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wide font-medium">Present</p>
                      <p className="text-lg font-bold">{workforce.total_present}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-red-600 dark:text-red-400 uppercase tracking-wide font-medium">Absent</p>
                      <p className="text-lg font-bold">{absentCount}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 uppercase tracking-wide font-medium">Incidents</p>
                      <p className="text-lg font-bold">{workforce.total_incidents}</p>
                    </div>
                  </div>

                  <div className="pt-1 space-y-2">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">OPEX ({workforce.department_count})</p>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      {workforce.departments.map((dept) => {
                        const deptRate = dept.rate ?? 0;
                        return (
                          <div key={dept.key} className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] font-medium text-foreground truncate max-w-[140px]">{dept.label}</span>
                              <span className="text-[10px] font-semibold">
                                {dept.present}/{dept.headcount}
                                <span className="text-muted-foreground ml-1">({deptRate}%)</span>
                              </span>
                            </div>
                            <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
                              <motion.div
                                className={`h-full rounded-full ${deptRate >= 80 ? "bg-emerald-500" : deptRate >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${deptRate}%` }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <ExpandRow id="workforce" expanded={expanded} onToggle={() => setExpanded((v) => !v)} />
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}