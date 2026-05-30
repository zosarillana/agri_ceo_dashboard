// submodules/accounts.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { mockData } from "@/routes/auth/-data/-mock-data";

function fmtPHP(n: number) {
  return "₱" + n.toLocaleString();
}

function accountBadge(type: string) {
  const map: any = {
    receivable: "default",
    revenue: "default",
    payable: "secondary",
    expense: "destructive",
    capex: "outline",
    opex: "outline",
  };

  return (
    <Badge variant={map[type]}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </Badge>
  );
}

// Add CAPEX and OPEX data
const additionalAccounts = [
  {
    description: "New Processing Equipment",
    amount: 2500000,
    type: "capex",
    due: "2024-03-15",
  },
  {
    description: "Warehouse Expansion",
    amount: 3750000,
    type: "capex",
    due: "2024-06-30",
  },
  {
    description: "Monthly Maintenance",
    amount: 125000,
    type: "opex",
    due: "2024-01-31",
  },
  {
    description: "Quality Testing Lab Supplies",
    amount: 68000,
    type: "opex",
    due: "2024-02-10",
  },
];

const allAccounts = [...(mockData.accounts || []), ...additionalAccounts];

export default function AccountsDash() {
  const receivables = allAccounts.filter(
    (a) => a.type === "receivable" || a.type === "revenue"
  );
  
  const payables = allAccounts.filter(
    (a) => a.type === "payable" || a.type === "expense"
  );
  
  const capex = allAccounts.filter((a) => a.type === "capex");
  const opex = allAccounts.filter((a) => a.type === "opex");

  const totalReceivable = receivables.reduce((s, a) => s + a.amount, 0);
  const totalPayable = payables.reduce((s, a) => s + a.amount, 0);
  const totalCAPEX = capex.reduce((s, a) => s + a.amount, 0);
  const totalOPEX = opex.reduce((s, a) => s + a.amount, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Receivable</p>
            <p className="text-2xl font-semibold">
              {fmtPHP(totalReceivable)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Payable</p>
            <p className="text-2xl font-semibold">
              {fmtPHP(totalPayable)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">CAPEX</p>
            <p className="text-2xl font-semibold">
              {fmtPHP(totalCAPEX)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">OPEX</p>
            <p className="text-2xl font-semibold">
              {fmtPHP(totalOPEX)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Receivables</h3>
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
              {receivables.map((a, idx) => (
                <TableRow key={`receivable-${idx}`}>
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

      <Card>
        <CardContent className="pt-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Payables</h3>
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
              {payables.map((a, idx) => (
                <TableRow key={`payable-${idx}`}>
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

      <Card>
        <CardContent className="pt-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Capital Expenditures (CAPEX)</h3>
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
              {capex.map((a, idx) => (
                <TableRow key={`capex-${idx}`}>
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

      <Card>
        <CardContent className="pt-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Operating Expenses (OPEX)</h3>
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
              {opex.map((a, idx) => (
                <TableRow key={`opex-${idx}`}>
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