import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  monitoredAccounts,
  fmtINR,
  fmtDate,
  type MonitoringStatus,
  type RiskLevel,
  type Recommendation,
  type AccountStatus,
} from "@/lib/fraud-data";
import {
  Kpi,
  RiskBadge,
  MonitoringStatusBadge,
  RecommendationBadge,
  AccountStatusBadge,
} from "@/components/risk-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { InvestigationPanel } from "@/components/InvestigationPanel";
import { toast } from "sonner";
import { Snowflake, XCircle, FileSearch, Eye } from "lucide-react";

export const Route = createFileRoute("/monitored/")({
  head: () => ({
    meta: [
      { title: "Monitored accounts · Sentinel Ops" },
      { name: "description", content: "Accounts under post-transaction monitoring after allow-with-monitoring decisions." },
    ],
  }),
  component: MonitoredList,
});

function MonitoredList() {
  const navigate = useNavigate();
  const [mStatus, setMStatus] = useState<string>("all");
  const [risk, setRisk] = useState<string>("all");
  const [rec, setRec] = useState<string>("all");
  const [acct, setAcct] = useState<string>("all");
  const [q, setQ] = useState("");
  const [invOpen, setInvOpen] = useState(false);
  const [invData, setInvData] = useState<any>(null);
  const [closeTarget, setCloseTarget] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return monitoredAccounts.filter((a) => {
      if (mStatus !== "all" && a.monitoringStatus !== (mStatus as MonitoringStatus)) return false;
      if (risk !== "all" && a.riskLevel !== (risk as RiskLevel)) return false;
      if (rec !== "all" && a.recommendation !== (rec as Recommendation)) return false;
      if (acct !== "all" && a.accountStatus !== (acct as AccountStatus)) return false;
      if (q) {
        const s = q.toLowerCase();
        return (
          a.customerName.toLowerCase().includes(s) ||
          a.customerId.toLowerCase().includes(s) ||
          a.accountId.toLowerCase().includes(s) ||
          a.triggerTxnId.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [mStatus, risk, rec, acct, q]);

  const kpis = {
    total: monitoredAccounts.length,
    review: monitoredAccounts.filter((a) => a.monitoringStatus === "review_required").length,
    freezeRec: monitoredAccounts.filter((a) => a.monitoringStatus === "freeze_recommended").length,
    frozen: monitoredAccounts.filter((a) => a.monitoringStatus === "frozen").length,
    exposure: monitoredAccounts.reduce((s, a) => s + a.exposure, 0),
  };

  const runInvestigation = (id: string) => {
    const a = monitoredAccounts.find((x) => x.accountId === id)!;
    setInvData({
      agentName: "Account Investigation Agent",
      score: a.riskScore,
      riskLevel: a.riskLevel,
      recommendation: a.investigation.recommendation,
      summary: a.reason,
      reasons: a.investigation.reasons,
      evidenceTxnIds: a.investigation.evidenceTxnIds,
      nextSteps: a.investigation.nextSteps,
    });
    setInvOpen(true);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Monitored accounts</h1>
          <p className="text-sm text-muted-foreground">
            Accounts under post-transaction monitoring after allow-with-monitoring decisions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi label="Total monitored" value={kpis.total} tone="info" />
        <Kpi label="Review required" value={kpis.review} tone="warn" />
        <Kpi label="Freeze recommended" value={kpis.freezeRec} tone="danger" />
        <Kpi label="Frozen" value={kpis.frozen} tone="critical" />
        <Kpi label="Total exposure" value={fmtINR(kpis.exposure)} tone="muted" />
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-card p-2">
        <Input
          placeholder="Search customer / account / txn ID"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-9 max-w-xs bg-background"
        />
        <Sel value={mStatus} onChange={setMStatus} label="Monitoring" options={[
          ["all", "All statuses"],
          ["monitoring", "Monitoring"],
          ["review_required", "Review required"],
          ["freeze_recommended", "Freeze recommended"],
          ["frozen", "Frozen"],
          ["closed", "Closed"],
        ]} />
        <Sel value={risk} onChange={setRisk} label="Risk" options={[
          ["all", "All risk levels"],
          ["low", "Low"], ["medium", "Medium"], ["high", "High"], ["critical", "Critical"],
        ]} />
        <Sel value={rec} onChange={setRec} label="Recommendation" options={[
          ["all", "All recommendations"],
          ["continue_monitoring", "Continue monitoring"],
          ["hold_and_review", "Hold & review"],
          ["freeze_recommended", "Freeze recommended"],
          ["close_account", "Close account"],
        ]} />
        <Sel value={acct} onChange={setAcct} label="Account" options={[
          ["all", "All account states"],
          ["active", "Active"], ["frozen", "Frozen"], ["closed", "Closed"],
        ]} />
        <div className="ml-auto text-xs text-muted-foreground">{filtered.length} of {monitoredAccounts.length}</div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-2">Customer / account</th>
                <th className="text-left font-medium px-3 py-2">Risk</th>
                <th className="text-left font-medium px-3 py-2">Monitoring</th>
                <th className="text-left font-medium px-3 py-2">Account</th>
                <th className="text-right font-medium px-3 py-2">Score</th>
                <th className="text-right font-medium px-3 py-2">Events</th>
                <th className="text-right font-medium px-3 py-2">Exposure</th>
                <th className="text-left font-medium px-3 py-2">Recommendation</th>
                <th className="text-left font-medium px-3 py-2">Last activity</th>
                <th className="text-right font-medium px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr
                  key={a.accountId}
                  className="border-t border-border hover:bg-muted/30 cursor-pointer"
                  onClick={() => navigate({ to: "/monitored/$accountId", params: { accountId: a.accountId } })}
                >
                  <td className="px-4 py-2.5">
                    <div className="font-medium">{a.customerName}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">{a.customerId} · {a.accountId}</div>
                    <div className="text-[11px] text-muted-foreground truncate max-w-xs mt-0.5">{a.reason}</div>
                  </td>
                  <td className="px-3 py-2.5"><RiskBadge level={a.riskLevel} /></td>
                  <td className="px-3 py-2.5"><MonitoringStatusBadge status={a.monitoringStatus} /></td>
                  <td className="px-3 py-2.5"><AccountStatusBadge status={a.accountStatus} /></td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{a.riskScore}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{a.riskEventCount}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{fmtINR(a.exposure)}</td>
                  <td className="px-3 py-2.5"><RecommendationBadge rec={a.recommendation} /></td>
                  <td className="px-3 py-2.5 text-[11px] text-muted-foreground">{fmtDate(a.lastActivity)}</td>
                  <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex items-center gap-1">
                      <Button asChild size="sm" variant="ghost" className="h-7 px-2">
                        <Link to="/monitored/$accountId" params={{ accountId: a.accountId }}>
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-[var(--info)]"
                        onClick={() => runInvestigation(a.accountId)}>
                        <FileSearch className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-[var(--danger)] disabled:opacity-30"
                        disabled={a.accountStatus !== "active"}
                        onClick={() => {
                          toast.success(`Freeze requested on ${a.accountId}`, {
                            description: "Action logged in audit trail.",
                          });
                        }}
                      >
                        <Snowflake className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-[var(--critical)] disabled:opacity-30"
                        disabled={a.accountStatus === "closed"}
                        onClick={() => setCloseTarget(a.accountId)}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-sm text-muted-foreground">No accounts match the current filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card p-3 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">Auto-escalation logic:</span>{" "}
        0–1 risky events → monitoring · 2–3 → review required · 4+ or hard fraud signal → freeze recommended · analyst action → frozen.
      </div>

      <InvestigationPanel open={invOpen} onOpenChange={setInvOpen} data={invData} />

      <AlertDialog open={!!closeTarget} onOpenChange={(o) => !o && setCloseTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close account {closeTarget}?</AlertDialogTitle>
            <AlertDialogDescription>
              This is a final action. The customer will lose access and outbound transfers will be permanently blocked. A SAR review will be triggered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[var(--critical)] text-[var(--critical-foreground)] hover:bg-[var(--critical)]/90"
              onClick={() => {
                toast.success(`Account ${closeTarget} closed`, { description: "Audit trail updated." });
                setCloseTarget(null);
              }}
            >
              Close account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Sel({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
  label: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-[180px] bg-background">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        {options.map(([v, l]) => (
          <SelectItem key={v} value={v}>{l}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}