import {
  createFileRoute,
  Outlet,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/auth/admin/dashboard")({
  component: DashboardLayout,
});

const tabs = [
  { id: "production",  label: "Production" },
  { id: "procurement", label: "Procurement" },
  { id: "sales",       label: "Sales" },
  { id: "accounts",    label: "Accounts" },
  { id: "trading",     label: "Trading" },
  { id: "qc",          label: "Quality Control" },
  { id: "workforce",   label: "Workforce" },
  { id: "maintenance", label: "Maintenance" },
] as const;

type DashboardSegment = (typeof tabs)[number]["id"];
type DashboardRoute = `/auth/admin/dashboard/${DashboardSegment}`;

function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const segments = location.pathname.split("/");
  const lastSegment = segments[segments.length - 1];
  const activeTab = tabs.find((t) => t.id === lastSegment)?.id ?? null;

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 ">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          {!activeTab ? (
            // Overview header
            <>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">CEO Dashboard</h1>
                <p className="text-sm text-muted-foreground mt-1">{today}</p>
              </div>
              <Badge variant="outline">Overview</Badge>
            </>
          ) : (
            // Sub-dashboard header
            <>
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mb-2 -ml-2"
                  onClick={() => navigate({ to: "/auth/admin/dashboard" })}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Overview
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">
                  {tabs.find((t) => t.id === activeTab)?.label}
                </h1>
              </div>
              <Badge variant="outline">Sub-dashboard</Badge>
            </>
          )}
        </div>

        <Separator className="my-6" />

        {/* TABS — only shown when inside a sub-route */}
        {activeTab && (
          <Tabs
            value={activeTab}
            onValueChange={(val) =>
              navigate({ to: `/auth/admin/dashboard/${val}` as DashboardRoute })
            }
          >
            <TabsList className="flex flex-wrap h-auto mb-6 gap-1">
              {tabs.map((t) => (
                <TabsTrigger key={t.id} value={t.id} className="text-xs">
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        {/* PAGE CONTENT */}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -25 }}
            transition={{ duration: 0.25 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
}