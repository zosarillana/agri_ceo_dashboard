// data/mock-data.ts

// ─────────────────────────────────────────────────────────────
// Shared Types
// ─────────────────────────────────────────────────────────────

export type UnitStatus =
  | "operational"
  | "down"
  | "maintenance"
  | "standby";

export interface ProductionData {
  coconutWater: number;
  cwc: number;
  coconutOil: number;
  creamUHT: number;
  creamFrozen: number;
  cakeFlour: number;
}

export interface ProcurementItem {
  name: string;
  quantity: number;
  unit: string;
  supplier: string;
  status: "received" | "pending" | "delayed";
}

export interface SalesItem {
  product: string;
  volume: number;
  unit: string;
  value: number;
  market: string;
}

export interface AccountItem {
  description: string;
  amount: number;
  type: "receivable" | "payable" | "expense" | "revenue";
  due: string;
}

export interface TradingItem {
  name: string;
  input: string;
  output: string;
  volumeIn: number;
  volumeOut: number;
  unit: string;
}

export interface QCData {
  passRate: number;
  rejectionRate: number;
  samplesTested: number;
  samplesPassed: number;
  products: {
    name: string;
    tested: number;
    passed: number;
  }[];
}

export interface WorkforceData {
  presentToday: number;
  totalHeadcount: number;
  safetyIncidents: number;
  departments: {
    name: string;
    present: number;
    total: number;
  }[];
}

export interface MaintenanceUnit {
  name: string;
  status: UnitStatus;
  lastChecked: string;
  nextScheduled: string;
  notes: string;
}

// ─────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────

export const mockData = {
  production: {
    coconutWater: 12400,
    cwc: 8750,
    coconutOil: 3200,
    creamUHT: 5600,
    creamFrozen: 2100,
    cakeFlour: 9800,
  } as ProductionData,

  procurement: [
    {
      name: "Raw coconuts",
      quantity: 45000,
      unit: "pcs",
      supplier: "Local Farms A",
      status: "received",
    },
    {
      name: "Packaging (Tetra)",
      quantity: 12000,
      unit: "units",
      supplier: "Tetra Pak PH",
      status: "pending",
    },
    {
      name: "Copra",
      quantity: 8500,
      unit: "kg",
      supplier: "Visayas Copra Co.",
      status: "received",
    },
    {
      name: "Cake flour additives",
      quantity: 650,
      unit: "kg",
      supplier: "ChemSource Inc.",
      status: "delayed",
    },
    {
      name: "VCO bottles",
      quantity: 3000,
      unit: "pcs",
      supplier: "PacPrint PH",
      status: "pending",
    },
  ] as ProcurementItem[],

  sales: [
    {
      product: "Coconut water (retail)",
      volume: 9200,
      unit: "units",
      value: 1380000,
      market: "Local",
    },
    {
      product: "Coconut oil (export)",
      volume: 2800,
      unit: "liters",
      value: 2240000,
      market: "Export",
    },
    {
      product: "Cream UHT",
      volume: 4100,
      unit: "units",
      value: 820000,
      market: "Local",
    },
    {
      product: "Cream frozen",
      volume: 1800,
      unit: "kg",
      value: 630000,
      market: "Food Service",
    },
    {
      product: "Cake flour",
      volume: 7600,
      unit: "kg",
      value: 532000,
      market: "B2B",
    },
    {
      product: "VCO (premium)",
      volume: 420,
      unit: "liters",
      value: 504000,
      market: "Export",
    },
  ] as SalesItem[],

  accounts: [
    {
      description: "Export receivable — Japan buyer",
      amount: 4200000,
      type: "receivable",
      due: "2024-02-15",
    },
    {
      description: "Raw material payable — Local Farms A",
      amount: 675000,
      type: "payable",
      due: "2024-01-30",
    },
    {
      description: "Utility expense — Plant",
      amount: 182000,
      type: "expense",
      due: "2024-01-31",
    },
    {
      description: "Tolling revenue — FMS",
      amount: 320000,
      type: "revenue",
      due: "Received",
    },
    {
      description: "Freight cost — Sea cargo",
      amount: 95000,
      type: "expense",
      due: "2024-02-05",
    },
  ] as AccountItem[],

  trading: [
    {
      name: "DC on-trade",
      input: "Desiccated coconut",
      output: "Packed DC",
      volumeIn: 12000,
      volumeOut: 11400,
      unit: "kg",
    },
    {
      name: "FMS tolling — cake → oil",
      input: "Cake",
      output: "Oil",
      volumeIn: 8500,
      volumeOut: 2800,
      unit: "kg",
    },
    {
      name: "FMS tolling — DC → VCO",
      input: "Desiccated coconut",
      output: "VCO",
      volumeIn: 1200,
      volumeOut: 420,
      unit: "kg",
    },
    {
      name: "New Asia — copra → RBD",
      input: "Copra",
      output: "RBD oil",
      volumeIn: 6000,
      volumeOut: 3200,
      unit: "kg",
    },
    {
      name: "Local sale",
      input: "Mixed products",
      output: "Revenue",
      volumeIn: 0,
      volumeOut: 0,
      unit: "—",
    },
  ] as TradingItem[],

  qc: {
    passRate: 96.4,
    rejectionRate: 3.6,
    samplesTested: 138,
    samplesPassed: 133,
    products: [
      {
        name: "Coconut water",
        tested: 42,
        passed: 41,
      },
      {
        name: "Coconut oil",
        tested: 28,
        passed: 27,
      },
      {
        name: "Cream UHT",
        tested: 35,
        passed: 34,
      },
      {
        name: "Cake flour",
        tested: 33,
        passed: 31,
      },
    ],
  } as QCData,

  workforce: {
    presentToday: 218,
    totalHeadcount: 240,
    safetyIncidents: 0,
    departments: [
      {
        name: "Production",
        present: 98,
        total: 108,
      },
      {
        name: "Quality Control",
        present: 22,
        total: 24,
      },
      {
        name: "Maintenance",
        present: 18,
        total: 20,
      },
      {
        name: "Logistics",
        present: 32,
        total: 36,
      },
      {
        name: "Administration",
        present: 28,
        total: 32,
      },
      {
        name: "Sales & Trading",
        present: 20,
        total: 20,
      },
    ],
  } as WorkforceData,

  maintenance: [
    {
      name: "Unit 1",
      status: "operational",
      lastChecked: "Today 06:00",
      nextScheduled: "2024-02-01",
      notes: "Running normally",
    },
    {
      name: "Unit 2",
      status: "operational",
      lastChecked: "Today 06:00",
      nextScheduled: "2024-02-08",
      notes: "Running normally",
    },
    {
      name: "Unit 3",
      status: "maintenance",
      lastChecked: "Yesterday",
      nextScheduled: "Today PM",
      notes: "Scheduled PM — bearings replacement",
    },
  ] as MaintenanceUnit[],
};