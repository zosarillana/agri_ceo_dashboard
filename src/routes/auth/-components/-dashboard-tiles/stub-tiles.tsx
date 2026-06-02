import * as React from "react";
import { Wallet, ShoppingCart, ArrowLeftRight } from "lucide-react";
import { mockData } from "@/routes/auth/-data/-mock-data";
import { fmt, fmtPHP } from "@/lib/dashboard-utils";
import { MockRow, StubCard } from "./shared-dashboard-ui";

// ── Mock Derivations ───────────────────────────────────────────────────────
const _acctReceivables = mockData.accounts
  .filter((a) => a.type === "receivable")
  .reduce((s, a) => s + a.amount, 0);
const _acctPayables = mockData.accounts
  .filter((a) => a.type === "payable" || a.type === "expense")
  .reduce((s, a) => s + a.amount, 0);
const _acctNet = _acctReceivables - _acctPayables;
const _acctOverdue = mockData.accounts.filter(
  (a) => a.type === "receivable" && a.due !== "Received" && new Date(a.due) < new Date(),
).length;

const _proc = mockData.procurement;
const _procDelayed = _proc.filter((p) => p.status === "delayed").length;
const _procOpen = _proc.filter((p) => p.status !== "received").length;

const _trades = mockData.trading.filter((t) => t.volumeIn > 0);
const _tradeTotalVolumeIn = _trades.reduce((s, t) => s + t.volumeIn, 0);
const _tradeActiveCount = _trades.length;

// ── Expanded Content ───────────────────────────────────────────────────────
export const AccountsExpanded = () => (
  <div className="space-y-2">
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Receivables</p>
        <p className="text-sm font-semibold">{fmtPHP(_acctReceivables)}</p>
      </div>
      <div className="space-y-1">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Payables + Exp.</p>
        <p className="text-sm font-semibold">{fmtPHP(_acctPayables)}</p>
      </div>
    </div>
    <div className="pt-1 border-t border-border/30 space-y-1.5">
      {mockData.accounts.slice(0, 3).map((a) => (
        <MockRow key={a.description} label={a.description.length > 32 ? a.description.slice(0, 32) + "…" : a.description} value={`${a.type === "payable" || a.type === "expense" ? "−" : "+"}${fmtPHP(a.amount)}`} />
      ))}
      <MockRow label="Overdue accounts" value={`${_acctOverdue} invoices`} />
    </div>
  </div>
);

const ProcurementExpanded = () => (
  <div className="space-y-2">
    <div className="pt-1 border-t border-border/30 space-y-1.5">
      {mockData.procurement.map((p) => (
        <div key={p.name} className="flex justify-between items-center">
          <span className="text-[10px] text-muted-foreground truncate max-w-[160px]">{p.name}</span>
          <span className={`text-[10px] font-semibold capitalize ${p.status === "received" ? "text-emerald-600 dark:text-emerald-400" : p.status === "delayed" ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}>{p.status}</span>
        </div>
      ))}
    </div>
  </div>
);

const TradingExpanded = () => (
  <div className="space-y-2">
    <div className="pt-1 border-t border-border/30 space-y-1.5">
      {mockData.trading.filter((t) => t.volumeIn > 0).map((t) => (
        <div key={t.name} className="flex justify-between items-center">
          <span className="text-[10px] text-muted-foreground truncate max-w-[160px]">{t.name}</span>
          <span className="text-[10px] font-semibold">{fmt(t.volumeIn)} → {fmt(t.volumeOut)} {t.unit}</span>
        </div>
      ))}
    </div>
  </div>
);

// ── Specific Stub Cards ────────────────────────────────────────────────────
export const AccountsStubCard = ({ active, index }: { active: boolean, index: number }) => (
  <StubCard id="accounts" color="purple" label="Accounts" icon={Wallet} summary={`Net position · ${fmtPHP(_acctNet)}`} stat={fmtPHP(_acctNet)} unit="net cash position" active={active} index={index} expandedContent={<AccountsExpanded />} />
);

export const ProcurementStubCard = ({ active, index }: { active: boolean, index: number }) => (
  <StubCard id="procurement" color="amber" label="Procurement" icon={ShoppingCart} summary={`${_procOpen} open POs · ${_procDelayed} delayed`} stat={String(_procOpen)} unit="open purchase orders" active={active} index={index} expandedContent={<ProcurementExpanded />} />
);

export const TradingStubCard = ({ active, index }: { active: boolean, index: number }) => (
  <StubCard id="trading" color="blue" label="Trading" icon={ArrowLeftRight} summary={`${_tradeActiveCount} operations · ${fmt(_tradeTotalVolumeIn)} kg input`} stat={String(_tradeActiveCount)} unit="active trade operations" active={active} index={index} expandedContent={<TradingExpanded />} />
);