// submodules/workforce.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { mockData } from "../../data/mock-data";

export default function WorkforceDash() {
  const { presentToday, totalHeadcount, departments } = mockData.workforce;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="pt-4 pb-4">
          <p className="text-xs text-muted-foreground">Present</p>
          <p className="text-2xl font-semibold">{presentToday}</p>
        </CardContent></Card>

        <Card><CardContent className="pt-4 pb-4">
          <p className="text-xs text-muted-foreground">Headcount</p>
          <p className="text-2xl font-semibold">{totalHeadcount}</p>
        </CardContent></Card>

        <Card><CardContent className="pt-4 pb-4">
          <p className="text-xs text-muted-foreground">Incidents</p>
          <p className="text-2xl font-semibold text-green-600">
            {mockData.workforce.safetyIncidents}
          </p>
        </CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Present</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {departments.map((d) => (
                <TableRow key={d.name}>
                  <TableCell>{d.name}</TableCell>
                  <TableCell className="text-right">{d.present}</TableCell>
                  <TableCell className="text-right">{d.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}