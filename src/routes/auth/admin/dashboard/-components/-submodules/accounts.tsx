// submodules/accounts.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { mockData } from "@/routes/auth/admin/dashboard/data/mock-data";
function fmtPHP(n: number) {
  return "₱" + n.toLocaleString();
}

function accountBadge(type: string) {
  const map: any = {
    receivable: "default",
    revenue: "default",
    payable: "secondary",
    expense: "destructive",
  };

  return (
    <Badge variant={map[type]}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </Badge>
  );
}

export default function AccountsDash() {
  const totalReceivable = mockData.accounts
    .filter((a) => a.type === "receivable" || a.type === "revenue")
    .reduce((s, a) => s + a.amount, 0);

  const totalPayable = mockData.accounts
    .filter((a) => a.type === "payable" || a.type === "expense")
    .reduce((s, a) => s + a.amount, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="pt-4 pb-4">
          <p className="text-xs text-muted-foreground mb-1">Receivable</p>
          <p className="text-xl font-semibold text-green-600">
            {fmtPHP(totalReceivable)}
          </p>
        </CardContent></Card>

        <Card><CardContent className="pt-4 pb-4">
          <p className="text-xs text-muted-foreground mb-1">Payable</p>
          <p className="text-xl font-semibold text-red-500">
            {fmtPHP(totalPayable)}
          </p>
        </CardContent></Card>

        <Card><CardContent className="pt-4 pb-4">
          <p className="text-xs text-muted-foreground mb-1">Net</p>
          <p className="text-xl font-semibold">
            {fmtPHP(totalReceivable - totalPayable)}
          </p>
        </CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Due</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {mockData.accounts.map((a) => (
                <TableRow key={a.description}>
                  <TableCell>{a.description}</TableCell>
                  <TableCell>{accountBadge(a.type)}</TableCell>
                  <TableCell className="text-right">{fmtPHP(a.amount)}</TableCell>
                  <TableCell className="text-right">{a.due}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}