// submodules/sales.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { mockData } from "@/routes/auth/admin/dashboard/data/mock-data";

function fmt(n: number) {
  return n.toLocaleString();
}

function fmtPHP(n: number) {
  return "₱" + n.toLocaleString();
}

export default function SalesDash() {
  const totalValue = mockData.sales.reduce((a, b) => a + b.value, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4 pb-4">
          <p className="text-xs text-muted-foreground mb-1">Total revenue</p>
          <p className="text-xl font-semibold">{fmtPHP(totalValue)}</p>
        </CardContent></Card>

        <Card><CardContent className="pt-4 pb-4">
          <p className="text-xs text-muted-foreground mb-1">Products sold</p>
          <p className="text-2xl font-semibold">{mockData.sales.length}</p>
        </CardContent></Card>

        <Card><CardContent className="pt-4 pb-4">
          <p className="text-xs text-muted-foreground mb-1">Export lines</p>
          <p className="text-2xl font-semibold">
            {mockData.sales.filter((s) => s.market === "Export").length}
          </p>
        </CardContent></Card>

        <Card><CardContent className="pt-4 pb-4">
          <p className="text-xs text-muted-foreground mb-1">Local lines</p>
          <p className="text-2xl font-semibold">
            {mockData.sales.filter((s) => s.market === "Local").length}
          </p>
        </CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Market</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {mockData.sales.map((s) => (
                <TableRow key={s.product}>
                  <TableCell className="font-medium">{s.product}</TableCell>
                  <TableCell>
                    <Badge variant={s.market === "Export" ? "default" : "outline"}>
                      {s.market}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {fmt(s.volume)} {s.unit}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {fmtPHP(s.value)}
                  </TableCell>
                </TableRow>
              ))}

              <TableRow>
                <TableCell colSpan={3} className="font-semibold">Total</TableCell>
                <TableCell className="text-right font-semibold">
                  {fmtPHP(totalValue)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}