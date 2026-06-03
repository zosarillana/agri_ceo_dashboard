import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, TrendingUp, TrendingDown, Banknote, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  CardHeader,
  CardTimestamp,
  AnimatedCard,
  ExpandRow,
} from "./shared-dashboard-ui";
import { fmtPHP, fmtMonthLabel, currentMonthKey } from "@/lib/dashboard-utils";
import { DashboardStats } from "@/types/dashboard.types";

function AccountsExpanded({ accounts }: { accounts: DashboardStats["accounts"] }) {
  if (!accounts) return null;

  const netPosition = (accounts.total_receivable ?? 0) - (accounts.total_payable ?? 0);
  const isPositive = netPosition >= 0;

  // Receivables as % of total (receivables + payables) for the progress bar
  const total = (accounts.total_receivable ?? 0) + (accounts.total_payable ?? 0);
  const receivablePct = total > 0 ? Math.round((accounts.total_receivable / total) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Receivables / Payables / Net — 3-box grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center p-2 rounded-md bg-emerald-500/5 border border-emerald-500/10">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-500 mb-1" />
          <p className="text-[10px] text-muted-foreground uppercase font-medium">Receivables</p>
          <p className="text-sm font-bold">{fmtPHP(accounts.total_receivable)}</p>
        </div>
        <div className="flex flex-col items-center p-2 rounded-md bg-rose-500/5 border border-rose-500/10">
          <TrendingDown className="h-3.5 w-3.5 text-rose-500 mb-1" />
          <p className="text-[10px] text-muted-foreground uppercase font-medium">Payables</p>
          <p className="text-sm font-bold">{fmtPHP(accounts.total_payable)}</p>
        </div>
        <div
          className={`flex flex-col items-center p-2 rounded-md border ${
            isPositive
              ? "bg-blue-500/5 border-blue-500/10"
              : "bg-amber-500/5 border-amber-500/10"
          }`}
        >
          <Banknote
            className={`h-3.5 w-3.5 mb-1 ${isPositive ? "text-blue-500" : "text-amber-500"}`}
          />
          <p className="text-[10px] text-muted-foreground uppercase font-medium">Net</p>
          <p
            className={`text-sm font-bold ${
              isPositive
                ? "text-blue-700 dark:text-blue-400"
                : "text-amber-700 dark:text-amber-400"
            }`}
          >
            {fmtPHP(Math.abs(netPosition))}
          </p>
        </div>
      </div>

      {/* Receivables coverage bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Receivables coverage</span>
          <span className="font-medium text-foreground">{receivablePct}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full bg-emerald-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${receivablePct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* CAPEX / OPEX breakdown */}
      {(accounts.total_capex != null || accounts.total_opex != null) && (
        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/30">
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
              CAPEX
            </p>
            <p className="text-sm font-semibold">
              {accounts.total_capex != null ? fmtPHP(accounts.total_capex) : "—"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
              OPEX
            </p>
            <p className="text-sm font-semibold">
              {accounts.total_opex != null ? fmtPHP(accounts.total_opex) : "—"}
            </p>
          </div>
        </div>
      )}

      {/* Low receivables warning */}
      {receivablePct < 40 && total > 0 && (
        <div className="p-2 rounded-md bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            <span className="text-amber-600 dark:text-amber-400 text-[10px] font-medium">
              Payables exceed receivables
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Receivables cover only {receivablePct}% of total outstanding — review cash flow position.
          </p>
        </div>
      )}
    </div>
  );
}

const expandVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: { height: "auto", opacity: 1 },
};

export function AccountsCard({
  active,
  index,
  accounts,
  timeLabel,
  dateLabel,
  basePath,
}: {
  active: boolean;
  index: number;
  accounts: DashboardStats["accounts"] | undefined;
  timeLabel: string;
  dateLabel: string;
  basePath?: string;
}) {
  const [expanded, setExpanded] = React.useState(false);

  const netPosition = (accounts?.total_receivable ?? 0) - (accounts?.total_payable ?? 0);
  const isPositive = netPosition >= 0;
  const monthLabel = accounts?.month
    ? fmtMonthLabel(accounts.month)
    : fmtMonthLabel(currentMonthKey());

  return (
    <AnimatedCard index={index}>
      <Card className={`transition-all hover:shadow-md ${active ? "border-primary" : ""}`}>
        <CardContent className="px-5 py-4 space-y-3">
          <div
            className="flex justify-between cursor-pointer"
            onClick={() => setExpanded((v) => !v)}
          >
            <CardHeader
              color="purple"
              icon={Wallet}
              label="Accounts"
              summary={`Net ${isPositive ? "surplus" : "deficit"} · ${monthLabel}`}
            />
            <div className="text-right">
              <p
                className={`text-2xl font-bold ${
                  isPositive
                    ? ""
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {fmtPHP(Math.abs(netPosition))}
              </p>
              <p className="text-xs text-muted-foreground">net cash position</p>
              <CardTimestamp timeLabel={timeLabel} dateLabel={dateLabel} />
            </div>
          </div>

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                key="accounts-expanded"
                variants={expandVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="pt-3 border-t border-border/50">
                  <AccountsExpanded accounts={accounts!} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <ExpandRow
            id="account"
            expanded={expanded}
            onToggle={() => setExpanded((v) => !v)}
            basePath={basePath}
          />
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}