import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createFileRoute, Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion';
import { Tabs } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/auth.store';

export const Route = createFileRoute('/auth/user/_layout/dashboard')({
  component: DashboardLayout,
})

const tabs = [
  { id: "production", label: "Production" },
  { id: "procurement", label: "Procurement" },
  { id: "sales", label: "Sales" },
  { id: "account", label: "Accounts" },
  { id: "trading", label: "Trading" },
  { id: "qc", label: "Quality Control" },
  { id: "workforce", label: "Workforce" },
  { id: "maintenance", label: "Maintenance" },
  { id: "energy", label: "Energy" },
] as const;

const DEPARTMENT_TAB_MAP: Record<string, string[]> = {
  sales: ["sales"],
  production: ["production"],
  maintenance: ["maintenance"],
  energy: ["energy"],
  qc: ["qc"],
  "quality control": ["qc"],
  procurement: ["procurement"],
  workforce: ["workforce"],
  trading: ["trading"],
  accounts: ["account"],
};

function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const activeTab = location.pathname.split("/").pop();
  const isOverview = activeTab === "dashboard";

  // Derive allowed tabs from user departments
  const departments = user?.departments ?? [];
  const allowedTabIds = new Set<string>();
  
  departments.forEach((dept) => {
    const key = dept.name.toLowerCase();
    const mapped = DEPARTMENT_TAB_MAP[key] ?? [];
    mapped.forEach((id) => allowedTabIds.add(id));
  });

  const filteredTabs = tabs.filter((t) => allowedTabIds.has(t.id));

  return (
    <div>
      {!isOverview && (
        <Tabs
          value={activeTab}
          onValueChange={(val) =>
            navigate({ to: `/auth/user/dashboard/${val}` })
          }
        >
          <TabsList className="flex flex-wrap mb-4 gap-1">
            {filteredTabs.map((t) => (
              <TabsTrigger key={t.id} value={t.id}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}