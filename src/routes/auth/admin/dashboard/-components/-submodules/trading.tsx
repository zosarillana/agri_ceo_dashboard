// submodules/trading.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { mockData } from "@/routes/auth/admin/dashboard/data/-mock-data";

function fmt(n: number) {
  return n.toLocaleString();
}

export default function TradingDash() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card><CardContent className="pt-4 pb-4">
          <p className="text-xs text-muted-foreground mb-1">Lines</p>
          <p className="text-2xl font-semibold">{mockData.trading.length}</p>
        </CardContent></Card>

        <Card><CardContent className="pt-4 pb-4">
          <p className="text-xs text-muted-foreground mb-1">Input Volume</p>
          <p className="text-2xl font-semibold">
            {fmt(mockData.trading.reduce((s, t) => s + t.volumeIn, 0))} kg
          </p>
        </CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Line</TableHead>
                <TableHead>Input</TableHead>
                <TableHead>Output</TableHead>
                <TableHead className="text-right">In</TableHead>
                <TableHead className="text-right">Out</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {mockData.trading.map((t) => (
                <TableRow key={t.name}>
                  <TableCell>{t.name}</TableCell>
                  <TableCell>{t.input}</TableCell>
                  <TableCell>{t.output}</TableCell>
                  <TableCell className="text-right">{t.volumeIn}</TableCell>
                  <TableCell className="text-right">{t.volumeOut}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}