import { Badge } from "@/components/ui/badge";
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

export function UserHeader() {
  const navigate = useNavigate();
  const matchRoute = useMatchRoute();
  const location = useLocation();

  const pageLabel =
    location.pathname
      .split("/")
      .filter(Boolean)
      .pop()
      ?.replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()) ?? "User";

  const isDashboard = matchRoute({
    to: "/auth/user/dashboard",
    fuzzy: true,
  });

  const isOverview = matchRoute({
    to: "/auth/user/dashboard",
    fuzzy: false,
  });

  const activeTab =
    tabs.find((t) =>
      matchRoute({
        to: `/auth/user/dashboard/${t.id}`,
        fuzzy: true,
      }),
    )?.id ?? null;
  // ---------------- NON DASHBOARD ----------------
  if (!isDashboard) {
    return (
      <>
        <div className="flex justify-between mt-2">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: "/auth/user/dashboard" })}
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
            <h1 className="text-3xl font-bold">Dashboard</h1>
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
            onClick={() => navigate({ to: "/auth/user/dashboard" })}
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
