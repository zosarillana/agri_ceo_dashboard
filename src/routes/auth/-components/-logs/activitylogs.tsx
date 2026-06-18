import { useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Loader2, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";

import {
  activityLogService,
  ActivityLog,
  ActivityLogQuery,
} from "@/services/activitylog.service";

// ─── Helpers ─────────────────────────────────────────────────────────────

function formatDate(date: string) {
  return new Date(date).toLocaleString();
}

function shortModel(model: string) {
  return model?.split("\\").pop() ?? model;
}

// ─── Component ───────────────────────────────────────────────────────────

export function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");

  const [filters] = useState<ActivityLogQuery>({
    per_page: 20,
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await activityLogService.getAll({
        ...filters,
        search: search || undefined,
      });

      // Laravel pagination response
      setLogs(res.data.data);
    } catch (err: any) {
      toast.error("Failed to load activity logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // debounce search trigger (simple version)
  useEffect(() => {
    const t = setTimeout(() => {
      fetchLogs();
    }, 400);

    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="max-w-full mx-auto space-y-6">

      {/* ── Header ───────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle>Activity Logs</CardTitle>
              <CardDescription>
                Track all user actions, updates, and system events.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search logs..."
                  className="pl-8"
                />
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={fetchLogs}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Record ID</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground py-10 text-sm"
                    >
                      No activity logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        {log.causer?.name ?? "System"}
                      </TableCell>

                      <TableCell>
                        <span className="capitalize">{log.description}</span>
                      </TableCell>

                      <TableCell className="text-muted-foreground">
                        {shortModel(log.subject_type)}
                      </TableCell>

                      <TableCell>{log.subject_id}</TableCell>

                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(log.created_at)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {!loading && logs.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2 text-right">
              Showing {logs.length} logs
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}