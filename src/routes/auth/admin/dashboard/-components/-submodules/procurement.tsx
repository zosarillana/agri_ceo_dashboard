// submodules/procurement.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { mockData } from "@/routes/auth/admin/dashboard/data/-mock-data";

function fmt(n: number) {
  return n.toLocaleString();
}

function procurementBadge(status: "received" | "pending" | "delayed") {
  if (status === "received") return <Badge>Received</Badge>;
  if (status === "pending") return <Badge variant="outline">Pending</Badge>;
  return <Badge variant="destructive">Delayed</Badge>;
}

export default function ProcurementDash() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Total items</p>
            <p className="text-2xl font-semibold">{mockData.procurement.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Received</p>
            <p className="text-2xl font-semibold text-green-600">
              {mockData.procurement.filter((p) => p.status === "received").length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Delayed</p>
            <p className="text-2xl font-semibold text-red-500">
              {mockData.procurement.filter((p) => p.status === "delayed").length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {mockData.procurement.map((p) => (
                <TableRow key={p.name}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{p.supplier}</TableCell>
                  <TableCell className="text-right">{fmt(p.quantity)} {p.unit}</TableCell>
                  <TableCell className="text-right">{procurementBadge(p.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}