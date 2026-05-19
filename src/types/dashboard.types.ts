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
  };
};