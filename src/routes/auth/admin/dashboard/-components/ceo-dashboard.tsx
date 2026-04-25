"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Factory,
  ShoppingCart,
  TrendingUp,
  Wallet,
  ArrowLeftRight,
  FlaskConical,
  Users,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type UnitStatus = "operational" | "down" | "maintenance" | "standby";
type StatusLevel = "good" | "warn" | "bad";

interface ProductionData {
  coconutWater: number;
  cwc: number;
  coconutOil: number;
  creamUHT: number;
  creamFrozen: number;
  cakeFlour: number;
}

interface ProcurementItem {
  name: string;
  quantity: number;
  unit: string;
  supplier: string;
  status: "received" | "pending" | "delayed";
}

interface SalesItem {
  product: string;
  volume: number;
  unit: string;
  value: number;
  market: string;
}

interface AccountItem {
  description: string;
  amount: number;
  type: "receivable" | "payable" | "expense" | "revenue";
  due: string;
}

interface TradingItem {
  name: string;
  input: string;
  output: string;
  volumeIn: number;
  volumeOut: number;
  unit: string;
}

interface QCData {
  passRate: number;
  rejectionRate: number;
  samplesTested: number;
  samplesPassed: number;
  products: { name: string; tested: number; passed: number }[];
}

interface WorkforceData {
  presentToday: number;
  totalHeadcount: number;
  safetyIncidents: number;
  departments: { name: string; present: number; total: number }[];
}

interface MaintenanceUnit {
  name: string;
  status: UnitStatus;
  lastChecked: string;
  nextScheduled: string;
  notes: string;
}

interface GroupDef {
  id: string;
  label: string;
  icon: React.ElementType;
  summary: string;
  stat: string;
  unit: string;
  status: StatusLevel;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockData = {
  production: {
    coconutWater: 12400,
    cwc: 8750,
    coconutOil: 3200,
    creamUHT: 5600,
    creamFrozen: 2100,
    cakeFlour: 9800,
  } as ProductionData,

  procurement: [
    { name: "Raw coconuts", quantity: 45000, unit: "pcs", supplier: "Local Farms A", status: "received" },
    { name: "Packaging (Tetra)", quantity: 12000, unit: "units", supplier: "Tetra Pak PH", status: "pending" },
    { name: "Copra", quantity: 8500, unit: "kg", supplier: "Visayas Copra Co.", status: "received" },
    { name: "Cake flour additives", quantity: 650, unit: "kg", supplier: "ChemSource Inc.", status: "delayed" },
    { name: "VCO bottles", quantity: 3000, unit: "pcs", supplier: "PacPrint PH", status: "pending" },
  ] as ProcurementItem[],

  sales: [
    { product: "Coconut water (retail)", volume: 9200, unit: "units", value: 1380000, market: "Local" },
    { product: "Coconut oil (export)", volume: 2800, unit: "liters", value: 2240000, market: "Export" },
    { product: "Cream UHT", volume: 4100, unit: "units", value: 820000, market: "Local" },
    { product: "Cream frozen", volume: 1800, unit: "kg", value: 630000, market: "Food Service" },
    { product: "Cake flour", volume: 7600, unit: "kg", value: 532000, market: "B2B" },
    { product: "VCO (premium)", volume: 420, unit: "liters", value: 504000, market: "Export" },
  ] as SalesItem[],

  accounts: [
    { description: "Export receivable — Japan buyer", amount: 4200000, type: "receivable", due: "2024-02-15" },
    { description: "Raw material payable — Local Farms A", amount: 675000, type: "payable", due: "2024-01-30" },
    { description: "Utility expense — Plant", amount: 182000, type: "expense", due: "2024-01-31" },
    { description: "Tolling revenue — FMS", amount: 320000, type: "revenue", due: "Received" },
    { description: "Freight cost — Sea cargo", amount: 95000, type: "expense", due: "2024-02-05" },
  ] as AccountItem[],

  trading: [
    { name: "DC on-trade", input: "Desiccated coconut", output: "Packed DC", volumeIn: 12000, volumeOut: 11400, unit: "kg" },
    { name: "FMS tolling — cake → oil", input: "Cake", output: "Oil", volumeIn: 8500, volumeOut: 2800, unit: "kg" },
    { name: "FMS tolling — DC → VCO", input: "Desiccated coconut", output: "VCO", volumeIn: 1200, volumeOut: 420, unit: "kg" },
    { name: "New Asia — copra → RBD", input: "Copra", output: "RBD oil", volumeIn: 6000, volumeOut: 3200, unit: "kg" },
    { name: "Local sale", input: "Mixed products", output: "Revenue", volumeIn: 0, volumeOut: 0, unit: "—" },
  ] as TradingItem[],

  qc: {
    passRate: 96.4,
    rejectionRate: 3.6,
    samplesTested: 138,
    samplesPassed: 133,
    products: [
      { name: "Coconut water", tested: 42, passed: 41 },
      { name: "Coconut oil", tested: 28, passed: 27 },
      { name: "Cream UHT", tested: 35, passed: 34 },
      { name: "Cake flour", tested: 33, passed: 31 },
    ],
  } as QCData,

  workforce: {
    presentToday: 218,
    totalHeadcount: 240,
    safetyIncidents: 0,
    departments: [
      { name: "Production", present: 98, total: 108 },
      { name: "Quality Control", present: 22, total: 24 },
      { name: "Maintenance", present: 18, total: 20 },
      { name: "Logistics", present: 32, total: 36 },
      { name: "Administration", present: 28, total: 32 },
      { name: "Sales & Trading", present: 20, total: 20 },
    ],
  } as WorkforceData,

  maintenance: [
    { name: "Unit 1", status: "operational", lastChecked: "Today 06:00", nextScheduled: "2024-02-01", notes: "Running normally" },
    { name: "Unit 2", status: "operational", lastChecked: "Today 06:00", nextScheduled: "2024-02-08", notes: "Running normally" },
    { name: "Unit 3", status: "maintenance", lastChecked: "Yesterday", nextScheduled: "Today PM", notes: "Scheduled PM — bearings replacement" },
  ] as MaintenanceUnit[],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString();
}

function fmtPHP(n: number) {
  return "₱" + n.toLocaleString();
}

function statusBadge(status: UnitStatus) {
  const map: Record<UnitStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    operational: { label: "Operational", variant: "default" },
    down: { label: "Down", variant: "destructive" },
    maintenance: { label: "Maintenance", variant: "secondary" },
    standby: { label: "Standby", variant: "outline" },
  };
  return <Badge variant={map[status].variant}>{map[status].label}</Badge>;
}

function procurementBadge(status: ProcurementItem["status"]) {
  if (status === "received") return <Badge variant="default">Received</Badge>;
  if (status === "pending") return <Badge variant="outline">Pending</Badge>;
  return <Badge variant="destructive">Delayed</Badge>;
}

function accountBadge(type: AccountItem["type"]) {
  const map = {
    receivable: "default",
    revenue: "default",
    payable: "secondary",
    expense: "destructive",
  } as const;
  return <Badge variant={map[type]}>{type.charAt(0).toUpperCase() + type.slice(1)}</Badge>;
}

// ─── Sub-dashboard components ─────────────────────────────────────────────────

function ProductionDash() {
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
              <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
              <p className="text-2xl font-semibold">{fmt(item.value)}</p>
              <p className="text-xs text-muted-foreground mt-1">{item.unit}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Daily output summary</CardTitle>
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
                  <TableCell className="text-right font-medium">{fmt(item.value)}</TableCell>
                  <TableCell className="text-right text-muted-foreground text-xs">{item.unit}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ProcurementDash() {
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

function SalesDash() {
  const totalValue = mockData.sales.reduce((a, b) => a + b.value, 0);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Total revenue</p>
            <p className="text-xl font-semibold">{fmtPHP(totalValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Products sold</p>
            <p className="text-2xl font-semibold">{mockData.sales.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Export lines</p>
            <p className="text-2xl font-semibold">{mockData.sales.filter((s) => s.market === "Export").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Local lines</p>
            <p className="text-2xl font-semibold">{mockData.sales.filter((s) => s.market === "Local").length}</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Market</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead className="text-right">Value (₱)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockData.sales.map((s) => (
                <TableRow key={s.product}>
                  <TableCell className="font-medium">{s.product}</TableCell>
                  <TableCell>
                    <Badge variant={s.market === "Export" ? "default" : "outline"}>{s.market}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{fmt(s.volume)} {s.unit}</TableCell>
                  <TableCell className="text-right font-medium">{fmtPHP(s.value)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} className="font-semibold">Total</TableCell>
                <TableCell className="text-right font-semibold">{fmtPHP(totalValue)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function AccountsDash() {
  const totalReceivable = mockData.accounts
    .filter((a) => a.type === "receivable" || a.type === "revenue")
    .reduce((s, a) => s + a.amount, 0);
  const totalPayable = mockData.accounts
    .filter((a) => a.type === "payable" || a.type === "expense")
    .reduce((s, a) => s + a.amount, 0);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Receivable / revenue</p>
            <p className="text-xl font-semibold text-green-600">{fmtPHP(totalReceivable)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Payable / expense</p>
            <p className="text-xl font-semibold text-red-500">{fmtPHP(totalPayable)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Net position</p>
            <p className={`text-xl font-semibold ${totalReceivable - totalPayable >= 0 ? "text-green-600" : "text-red-500"}`}>
              {fmtPHP(totalReceivable - totalPayable)}
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount (₱)</TableHead>
                <TableHead className="text-right">Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockData.accounts.map((a) => (
                <TableRow key={a.description}>
                  <TableCell className="font-medium">{a.description}</TableCell>
                  <TableCell>{accountBadge(a.type)}</TableCell>
                  <TableCell className="text-right">{fmtPHP(a.amount)}</TableCell>
                  <TableCell className="text-right text-muted-foreground text-sm">{a.due}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function TradingDash() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Active trading lines</p>
            <p className="text-2xl font-semibold">{mockData.trading.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Total input volume</p>
            <p className="text-2xl font-semibold">{fmt(mockData.trading.reduce((s, t) => s + t.volumeIn, 0))} kg</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Line</TableHead>
                <TableHead>Input</TableHead>
                <TableHead>Output</TableHead>
                <TableHead className="text-right">Vol in</TableHead>
                <TableHead className="text-right">Vol out</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockData.trading.map((t) => (
                <TableRow key={t.name}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{t.input}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{t.output}</TableCell>
                  <TableCell className="text-right">{t.volumeIn ? fmt(t.volumeIn) + " " + t.unit : "—"}</TableCell>
                  <TableCell className="text-right">{t.volumeOut ? fmt(t.volumeOut) + " " + t.unit : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function QCDash() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Pass rate</p>
            <p className="text-2xl font-semibold text-green-600">{mockData.qc.passRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Rejection rate</p>
            <p className="text-2xl font-semibold text-red-500">{mockData.qc.rejectionRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Samples tested</p>
            <p className="text-2xl font-semibold">{mockData.qc.samplesTested}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Samples passed</p>
            <p className="text-2xl font-semibold">{mockData.qc.samplesPassed}</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Per-product breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Tested</TableHead>
                <TableHead className="text-right">Passed</TableHead>
                <TableHead className="text-right">Pass rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockData.qc.products.map((p) => (
                <TableRow key={p.name}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-right">{p.tested}</TableCell>
                  <TableCell className="text-right">{p.passed}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={p.passed / p.tested >= 0.96 ? "default" : "secondary"}>
                      {((p.passed / p.tested) * 100).toFixed(1)}%
                    </Badge>
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

function WorkforceDash() {
  const { presentToday, totalHeadcount, safetyIncidents, departments } = mockData.workforce;
  const attendanceRate = ((presentToday / totalHeadcount) * 100).toFixed(1);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Present today</p>
            <p className="text-2xl font-semibold">
              {presentToday}{" "}
              <span className="text-sm text-muted-foreground">/ {totalHeadcount}</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Attendance rate</p>
            <p className="text-2xl font-semibold text-green-600">{attendanceRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Safety incidents</p>
            <p className={`text-2xl font-semibold ${safetyIncidents === 0 ? "text-green-600" : "text-red-500"}`}>
              {safetyIncidents}
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">By department</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Present</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((d) => (
                <TableRow key={d.name}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell className="text-right">{d.present}</TableCell>
                  <TableCell className="text-right">{d.total}</TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={
                        d.present / d.total >= 0.9
                          ? "default"
                          : d.present / d.total >= 0.75
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {((d.present / d.total) * 100).toFixed(0)}%
                    </Badge>
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

function MaintenanceDash() {
  const operational = mockData.maintenance.filter((m) => m.status === "operational").length;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Total units</p>
            <p className="text-2xl font-semibold">{mockData.maintenance.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Operational</p>
            <p className="text-2xl font-semibold text-green-600">{operational}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Under maintenance</p>
            <p className="text-2xl font-semibold text-yellow-600">
              {mockData.maintenance.filter((m) => m.status === "maintenance").length}
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-3">
        {mockData.maintenance.map((u) => (
          <Card key={u.name}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold">{u.name}</p>
                  <p className="text-sm text-muted-foreground">{u.notes}</p>
                </div>
                {statusBadge(u.status)}
              </div>
              <Separator className="my-3" />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Last checked</p>
                  <p className="font-medium">{u.lastChecked}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Next scheduled</p>
                  <p className="font-medium">{u.nextScheduled}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Status icon ──────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: StatusLevel }) {
  if (status === "good") return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  if (status === "warn") return <Clock className="h-4 w-4 text-yellow-500" />;
  return <AlertCircle className="h-4 w-4 text-red-500" />;
}

// ─── Groups (typed as GroupDef[] — fixes the TS error) ────────────────────────

const groups: GroupDef[] = [
  {
    id: "production",
    label: "Production output",
    icon: Factory,
    summary: "6 product lines running",
    stat: fmt(mockData.production.coconutWater + mockData.production.cwc + mockData.production.creamUHT),
    unit: "units today",
    status: "good",
  },
  {
    id: "procurement",
    label: "Procurement",
    icon: ShoppingCart,
    summary: `${mockData.procurement.filter((p) => p.status === "delayed").length} item(s) delayed`,
    stat: `${mockData.procurement.filter((p) => p.status === "received").length}/${mockData.procurement.length}`,
    unit: "items received",
    status: mockData.procurement.some((p) => p.status === "delayed") ? "warn" : "good",
  },
  {
    id: "sales",
    label: "Sales",
    icon: TrendingUp,
    summary: `${mockData.sales.length} product lines`,
    stat: fmtPHP(mockData.sales.reduce((a, b) => a + b.value, 0)),
    unit: "total revenue",
    status: "good",
  },
  {
    id: "accounts",
    label: "Accounts",
    icon: Wallet,
    summary: "Net positive",
    stat: fmtPHP(
      mockData.accounts
        .filter((a) => ["receivable", "revenue"].includes(a.type))
        .reduce((s, a) => s + a.amount, 0) -
      mockData.accounts
        .filter((a) => ["payable", "expense"].includes(a.type))
        .reduce((s, a) => s + a.amount, 0)
    ),
    unit: "net position",
    status: "good",
  },
  {
    id: "trading",
    label: "Trading / tolling",
    icon: ArrowLeftRight,
    summary: `${mockData.trading.length} active lines`,
    stat: fmt(mockData.trading.reduce((s, t) => s + t.volumeIn, 0)),
    unit: "kg input today",
    status: "good",
  },
  {
    id: "qc",
    label: "Quality control",
    icon: FlaskConical,
    summary: `${mockData.qc.samplesTested} samples tested`,
    stat: `${mockData.qc.passRate}%`,
    unit: "pass rate",
    status: mockData.qc.passRate >= 95 ? "good" : "warn",
  },
  {
    id: "workforce",
    label: "Workforce",
    icon: Users,
    summary:
      mockData.workforce.safetyIncidents === 0
        ? "No safety incidents"
        : `${mockData.workforce.safetyIncidents} incidents`,
    stat: `${mockData.workforce.presentToday}/${mockData.workforce.totalHeadcount}`,
    unit: "present today",
    status: mockData.workforce.safetyIncidents === 0 ? "good" : "bad",
  },
  {
    id: "maintenance",
    label: "Maintenance",
    icon: Wrench,
    summary: `${mockData.maintenance.filter((m) => m.status === "operational").length} units operational`,
    stat: `${mockData.maintenance.filter((m) => m.status === "operational").length}/${mockData.maintenance.length}`,
    unit: "units online",
    status: mockData.maintenance.some((m) => m.status === "down")
      ? "bad"
      : mockData.maintenance.some((m) => m.status === "maintenance")
      ? "warn"
      : "good",
  },
];

// ─── Sub-dashboard registry ───────────────────────────────────────────────────

const subDashboards: Record<string, React.ReactNode> = {
  production: <ProductionDash />,
  procurement: <ProcurementDash />,
  sales: <SalesDash />,
  accounts: <AccountsDash />,
  trading: <TradingDash />,
  qc: <QCDash />,
  workforce: <WorkforceDash />,
  maintenance: <MaintenanceDash />,
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function CEODashboard() {
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const activeGroupMeta = groups.find((g) => g.id === activeGroup);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            {activeGroup && (
              <Button
                variant="ghost"
                size="sm"
                className="mb-1 -ml-2 text-muted-foreground"
                onClick={() => setActiveGroup(null)}
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Overview
              </Button>
            )}
            <h1 className="text-2xl font-semibold tracking-tight">
              {activeGroupMeta ? activeGroupMeta.label : "CEO daily operations"}
            </h1>
            <p className="text-sm text-muted-foreground">{today}</p>
          </div>
          {activeGroup && (
            <Badge variant="outline" className="text-xs">
              Sub-dashboard
            </Badge>
          )}
        </div>

        {/* Overview */}
        {!activeGroup && (
          <>
            {/* Top KPI strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-1">Total sales revenue</p>
                  <p className="text-xl font-semibold">
                    {fmtPHP(mockData.sales.reduce((a, b) => a + b.value, 0))}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-1">QC pass rate</p>
                  <p className="text-xl font-semibold text-green-600">{mockData.qc.passRate}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-1">Workforce present</p>
                  <p className="text-xl font-semibold">
                    {mockData.workforce.presentToday}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      / {mockData.workforce.totalHeadcount}
                    </span>
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-1">Safety incidents</p>
                  <p
                    className={`text-xl font-semibold ${
                      mockData.workforce.safetyIncidents === 0 ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {mockData.workforce.safetyIncidents === 0 ? "None" : mockData.workforce.safetyIncidents}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Group cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {groups.map((g) => {
                const Icon = g.icon;
                return (
                  <Card
                    key={g.id}
                    className="cursor-pointer hover:border-foreground/30 transition-colors"
                    onClick={() => setActiveGroup(g.id)}
                  >
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="rounded-md bg-muted p-2 mt-0.5">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="font-medium text-sm">{g.label}</p>
                              <StatusIcon status={g.status} />
                            </div>
                            <p className="text-xs text-muted-foreground">{g.summary}</p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <div>
                            <p className="font-semibold text-base">{g.stat}</p>
                            <p className="text-xs text-muted-foreground">{g.unit}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {/* Sub-dashboard */}
        {activeGroup && (
          <Tabs defaultValue={activeGroup} onValueChange={setActiveGroup}>
            <TabsList className="flex flex-wrap h-auto gap-1 mb-4">
              {groups.map((g) => (
                <TabsTrigger key={g.id} value={g.id} className="text-xs">
                  {g.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {groups.map((g) => (
              <TabsContent key={g.id} value={g.id}>
                {subDashboards[g.id]}
              </TabsContent>
            ))}
          </Tabs>
        )}

      </div>
    </div>
  );
}