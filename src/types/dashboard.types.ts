export type DashboardStats = {
  production: {
    today_production_output: number;
    yesterday_production_output: number;
    total_production_entries: number;
    this_month_production_entries: number;
    last_updated_at: string | null;
  };

  maintenance: {
    total_units: number;
    checked_today: number;
    unchecked_today: number;
    completion: number;
    status_breakdown: {
      operational: number;
      maintenance: number;
      standby: number;
      down: number;
    };
    last_updated_at: string | null;
  };

  sales: {
    this_month: {
      total_usd: number;
      total_kg: number;
      entry_count: number;
      export_count: number;
      local_count: number;
    };
    last_month: {
      total_usd: number;
      total_kg: number;
      entry_count: number;
    };
    mom_change_pct: number | null;
    monthly_breakdown: {
      month: string;
      total_usd: number;
      total_kg: number;
      entry_count: number;
    }[];
    last_updated_at: string | null;
  };

  energy: {
    current_month: {
      month: string;
      total_billed: number;
      total_kw: number;
      total_demand: number;
      account2_billed: number;
      account3_billed: number;
      account2_kw: number;
      account3_kw: number;
      has_data: boolean;
    };
    previous_month: {
      month: string;
      total_billed: number;
      total_kw: number;
      total_demand: number;
      account2_billed: number;
      account3_billed: number;
      has_data: boolean;
    };
    mom_change_pct: number | null;
    records: {
      account2: Array<any>;
      account3: Array<any>;
    };
    ytd_summary: {
      total_billed_amount: number;
      total_kw: number;
      total_demand: number;
      account2_total: number;
      account3_total: number;
    };
    monthly_trends: Array<{
      month: string;
      total_billed: number;
      total_kw: number;
      total_demand: number;
    }>;
    total_accounts: number;
    total_months: number;
    last_updated_at: string | null;
  };

  // Add workforce to DashboardStats
  workforce: WorkforceStats;
};

export interface WorkforceDeptStat {
  key: string;
  label: string;
  section: string;
  present: number;
  headcount: number;
  incidents: number;
  rate: number | null;
}

export interface WorkforceStats {
  total_present: number;
  total_headcount: number;
  total_incidents: number;
  attendance_rate: number | null;
  department_count: number;
  by_section: Record<string, {
    present: number;
    headcount: number;
    incidents: number;
    rate: number | null;
  }>;
  lowest_dept: { label: string; rate: number | null } | null;
  departments: WorkforceDeptStat[];
  last_updated_at: string | null;
}