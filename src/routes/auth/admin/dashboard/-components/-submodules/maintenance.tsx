// submodules/maintenance.tsx
"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, Activity, Clock, CalendarClock, Factory } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockData } from "@/routes/auth/admin/dashboard/data/-mock-data";

function statusBadge(status: string) {
  if (status === "operational")
    return (
      <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20 border">
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
        Operational
      </Badge>
    );
  if (status === "maintenance")
    return (
      <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/20 hover:bg-amber-500/20 border">
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />
        Maintenance
      </Badge>
    );
  if (status === "down")
    return (
      <Badge className="bg-rose-500/15 text-rose-600 border-rose-500/20 hover:bg-rose-500/20 border">
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-rose-500 inline-block" />
        Down
      </Badge>
    );
  return (
    <Badge variant="outline">
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground inline-block" />
      Standby
    </Badge>
  );
}

function plantSummaryBadge(units: typeof mockData.maintenance) {
  const downCount = units.filter((u) => u.status === "down").length;
  const maintCount = units.filter((u) => u.status === "maintenance").length;
  if (downCount > 0)
    return (
      <Badge className="bg-rose-500/15 text-rose-600 border-rose-500/20 border">
        {downCount} Down
      </Badge>
    );
  if (maintCount > 0)
    return (
      <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/20 border">
        {maintCount} In Maintenance
      </Badge>
    );
  return (
    <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20 border">
      All Operational
    </Badge>
  );
}

function plantStatusBar(units: typeof mockData.maintenance) {
  const total = units.length;
  const operational = units.filter((u) => u.status === "operational").length;
  const maintenance = units.filter((u) => u.status === "maintenance").length;
  const down = units.filter((u) => u.status === "down").length;

  return (
    <div className="flex gap-0.5 w-24 h-1.5 rounded-full overflow-hidden">
      {operational > 0 && (
        <div className="bg-emerald-500 rounded-full" style={{ width: `${(operational / total) * 100}%` }} />
      )}
      {maintenance > 0 && (
        <div className="bg-amber-500 rounded-full" style={{ width: `${(maintenance / total) * 100}%` }} />
      )}
      {down > 0 && (
        <div className="bg-rose-500 rounded-full" style={{ width: `${(down / total) * 100}%` }} />
      )}
    </div>
  );
}

export default function MaintenanceDash() {
  const units = mockData.maintenance;
  const plants = Array.from(new Set(units.map((u) => u.plant)));

  const [openPlants, setOpenPlants] = React.useState<Set<string>>(
    new Set([plants[0]])
  );

  function togglePlant(plant: string) {
    setOpenPlants((prev) => {
      const next = new Set(prev);
      next.has(plant) ? next.delete(plant) : next.add(plant);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {plants.map((plant) => {
        const plantUnits = units.filter((u) => u.plant === plant);
        const isOpen = openPlants.has(plant);

        return (
          <Card key={plant} className="overflow-hidden">
            {/* Plant header */}
            <button className="w-full text-left" onClick={() => togglePlant(plant)}>
              <div className="flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted">
                    <Factory className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="font-semibold text-sm leading-none">{plant}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        {plantUnits.length} unit{plantUnits.length !== 1 ? "s" : ""}
                      </p>
                      {plantStatusBar(plantUnits)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {plantSummaryBadge(plantUnits)}
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform duration-200",
                      isOpen && "rotate-180"
                    )}
                  />
                </div>
              </div>
            </button>

            {/* Expandable unit list */}
            <div
              className={cn(
                "grid transition-all duration-200 ease-in-out",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <div className="overflow-hidden">
                <Separator />
                <div className="p-4 space-y-2">
                  {plantUnits.map((u) => (
                    <div
                      key={u.name}
                      className="rounded-lg border bg-muted/30 px-4 py-3 space-y-3"
                    >
                      {/* Unit header */}
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                          <p className="font-medium text-sm">{u.name}</p>
                        </div>
                        {statusBadge(u.status)}
                      </div>

                      {/* Notes */}
                      <p className="text-xs text-muted-foreground leading-relaxed">{u.notes}</p>

                      {/* Timestamps */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-start gap-2">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <p className="text-muted-foreground text-xs">Last Checked</p>
                            <p className="text-xs font-medium">{u.lastChecked}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <CalendarClock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <p className="text-muted-foreground text-xs">Next Scheduled</p>
                            <p className="text-xs font-medium">{u.nextScheduled}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}