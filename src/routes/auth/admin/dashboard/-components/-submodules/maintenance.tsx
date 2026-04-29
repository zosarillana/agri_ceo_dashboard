// submodules/maintenance.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { mockData } from "../../data/mock-data";

function statusBadge(status: string) {
  if (status === "operational") return <Badge>Operational</Badge>;
  if (status === "maintenance") return <Badge variant="secondary">Maintenance</Badge>;
  if (status === "down") return <Badge variant="destructive">Down</Badge>;
  return <Badge variant="outline">Standby</Badge>;
}

export default function MaintenanceDash() {
  return (
    <div className="space-y-4">
      {mockData.maintenance.map((u) => (
        <Card key={u.name}>
          <CardContent className="pt-4 pb-4">
            <div className="flex justify-between">
              <div>
                <p className="font-semibold">{u.name}</p>
                <p className="text-sm text-muted-foreground">{u.notes}</p>
              </div>
              {statusBadge(u.status)}
            </div>

            <Separator className="my-3" />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Last Checked</p>
                <p>{u.lastChecked}</p>
              </div>

              <div>
                <p className="text-muted-foreground text-xs">Next Scheduled</p>
                <p>{u.nextScheduled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}