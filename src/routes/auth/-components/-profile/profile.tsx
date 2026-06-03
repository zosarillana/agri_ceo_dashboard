import { useAuthStore } from "@/store/auth.store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Building2,
  ShieldCheck,
  Calendar,
  Clock,
} from "lucide-react";
import { format } from "date-fns";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getRoleBadgeColor(role: string) {
  switch (role) {
    case "superadmin":
      return "bg-purple-500/10 text-purple-600 border-purple-500/20";
    case "admin":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function Profile() {
  const { user } = useAuthStore();

  if (!user) return null;

  const fields = [
    {
      icon: User,
      label: "Full Name",
      value: user.name,
    },
    {
      icon: Mail,
      label: "Email Address",
      value: user.email,
    },
    {
      icon: Building2,
      label: "Department",
      value:
        Array.isArray(user.departments) && user.departments.length > 0
          ? user.departments.map((d) => d.name).join(", ")
          : "Not assigned",
    },

    {
      icon: Calendar,
      label: "Member Since",
      value: format(new Date(user.created_at), "MMMM dd, yyyy"),
    },
    {
      icon: Clock,
      label: "Last Updated",
      value: format(new Date(user.updated_at), "MMMM dd, yyyy"),
    },
  ];

  return (
    <div className="max-w-full mx-auto space-y-6">
      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="overflow-hidden">
          {/* Green gradient top bar */}
          <div className="h-24 bg-gradient-to-r from-[#1a9e6e] to-[#1a9e6e]/40 -mt-4" />

          <CardContent className="pt-0 pb-6 px-6">
            <div className="flex items-end gap-4 -mt-10 mb-4">
              <Avatar className="h-20 w-20 border-4 border-background shadow-md">
                <AvatarFallback className="bg-[#1a9e6e] text-white text-2xl font-bold">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="mb-1">
                <h2 className="text-xl font-bold leading-tight">{user.name}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <Badge
                variant="outline"
                className={`capitalize text-xs font-medium ${getRoleBadgeColor(user.role)}`}
              >
                {user.role}
              </Badge>
              {user.departments && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <Badge variant="outline" className="text-xs font-medium">
                    {user.departments.length}{" "}
                    {user.departments.length === 1
                      ? "Department"
                      : "Departments"}
                  </Badge>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 px-6">
            {fields.map((field, i) => {
              const Icon = field.icon;
              return (
                <div key={field.label}>
                  <div className="flex items-center gap-4 py-3">
                    <div className="shrink-0 w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">
                        {field.label}
                      </p>
                      <p className="text-sm font-medium truncate">
                        {field.value}
                      </p>
                    </div>
                  </div>
                  {i < fields.length - 1 && <Separator />}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
