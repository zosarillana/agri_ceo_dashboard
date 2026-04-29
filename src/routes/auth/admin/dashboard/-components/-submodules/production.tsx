"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { mockData } from "@/routes/auth/admin/dashboard/data/mock-data";

function fmt(n: number) {
  return n.toLocaleString();
}

export default function ProductionDash() {
  const d = mockData.production;

  const items = [
    { label: "Coconut water", value: d.coconutWater, unit: "units/day" },
    { label: "CWC", value: d.cwc, unit: "units/day" },
    { label: "Coconut oil", value: d.coconutOil, unit: "liters/day" },
    { label: "Cream UHT", value: d.creamUHT, unit: "units/day" },
    { label: "Cream frozen", value: d.creamFrozen, unit: "kg/day" },
    { label: "Cake flour", value: d.cakeFlour, unit: "kg/day" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {items.map((item) => (
          <Card key={item.label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground mb-1">
                {item.label}
              </p>

              <p className="text-2xl font-semibold">
                {fmt(item.value)}
              </p>

              <p className="text-xs text-muted-foreground mt-1">
                {item.unit}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Daily output summary
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead className="text-right">Unit</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {items.map((item) => (
                <TableRow key={item.label}>
                  <TableCell>{item.label}</TableCell>

                  <TableCell className="text-right font-medium">
                    {fmt(item.value)}
                  </TableCell>

                  <TableCell className="text-right text-muted-foreground text-xs">
                    {item.unit}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}