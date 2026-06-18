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

  // Add QC to DashboardStats
  qc: QcStats;

  // Add workforce to DashboardStats
  workforce: WorkforceStats;

  procurement: {
    total_items: number;
    received: number;
    delayed: number;
    pending: number;
    from: string | null;
    to: string | null;
    month: string;
    has_data: boolean;
  };

  trading: {
    total_volume: number;
    total_value: number;
    avg_price: number;
    total_orders: number;
    export_orders: number;
    local_orders: number;
    from: string | null;
    to: string | null;
    month: string;
    has_data: boolean;
    last_updated_at: string | null;
  };

  accounts: {
    total_receivable: number;
    total_payable: number;
    total_capex: number;
    total_opex: number;
    from: string | null;
    to: string | null;
    month: string;
    has_data: boolean;
    last_updated_at: string | null;
  };
};

export interface QcProductPerformance {
  product_name: string;
  tested: number;
  passed: number;
  failed: number;
  pass_rate: number;
}

export interface QcDailyTrend {
  date: string;
  tested: number;
  passed: number;
  failed: number;
  pass_rate: number;
}

export interface QcWeeklyBreakdown {
  week: string;
  start_date: string;
  end_date: string;
  tested: number;
  passed: number;
  failed: number;
  pass_rate: number;
}

export interface QcStats {
  current_month: {
    samples_tested: number;
    samples_passed: number;
    samples_failed: number;
    pass_rate: number;
    rejection_rate: number;
    products_tested: number;
    month: string;
  };
  previous_month: {
    samples_tested: number;
    samples_passed: number;
    samples_failed: number;
    pass_rate: number;
    rejection_rate: number;
    products_tested: number;
    month: string;
  };
  mom_pass_rate_change: number | null;
  weekly_breakdown: QcWeeklyBreakdown[];
  daily_trend: QcDailyTrend[];
  top_products: QcProductPerformance[];
  product_performance: QcProductPerformance[];
  has_data: boolean;
  last_updated_at: string | null;
}

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