import { Badge } from "@/components/ui/badge";
import DatePickerInline from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import {
  useMatchRoute,
  useNavigate,
  useLocation,
} from "@tanstack/react-router";
import { Separator } from "@/components/ui/separator";

const tabs = [
  { id: "production", label: "Production" },
  { id: "procurement", label: "Procurement" },
  { id: "sales", label: "Sales" },
  { id: "accounts", label: "Accounts" },
  { id: "trading", label: "Trading" },
  { id: "qc", label: "Quality Control" },
  { id: "workforce", label: "Workforce" },
  { id: "maintenance", label: "Maintenance" },
  { id: "energy", label: "Energy" },
] as const;

export function AdminHeader() {
  const navigate = useNavigate();
  const matchRoute = useMatchRoute();
  const location = useLocation();

  const pageLabel =
    location.pathname
      .split("/")
      .filter(Boolean)
      .pop()
      ?.replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()) ?? "Admin";

  const isDashboard = matchRoute({
    to: "/auth/admin/dashboard",
    fuzzy: true,
  });

  const isOverview = matchRoute({
    to: "/auth/admin/dashboard",
    fuzzy: false,
  });

  const activeTab =
    tabs.find((t) =>
      matchRoute({
        to: `/auth/admin/dashboard/${t.id}`,
        fuzzy: true,
      }),
    )?.id ?? null;

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // ---------------- NON DASHBOARD ----------------
  if (!isDashboard) {
    return (
      <>
        <div className="flex justify-between mt-2">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: "/auth/admin/dashboard" })}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Overview
            </Button>
            <h1 className="text-3xl font-bold">{pageLabel}</h1>
          </div>
          <Badge>{pageLabel}</Badge>
        </div>
        <Separator className="my-4" />
      </>
    );
  }

  // ---------------- OVERVIEW ----------------
  if (isOverview) {
    return (
      <>
        <div className="flex justify-between mt-2">
          <div>
            <h1 className="text-3xl font-bold">CEO Dashboard</h1>
            {/* <p className="text-sm text-muted-foreground">{today}</p>
            <DatePickerInline /> */}
          </div>
          <Badge>Overview</Badge>
        </div>
        <Separator className="my-3" />
      </>
    );
  }

  // ---------------- SUB DASHBOARD ----------------
  const activeTabLabel =
    tabs.find((t) => t.id === activeTab)?.label ?? "Dashboard";

  return (
    <>
      <div className="flex justify-between mt-2">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/auth/admin/dashboard" })}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Overview
          </Button>
          <h1 className="text-3xl font-bold">{activeTabLabel}</h1>
        </div>
        <Badge>Sub-dashboard</Badge>
      </div>
      <Separator className="my-3" />
    </>
  );
}
