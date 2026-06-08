import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { monitoredAccounts, fmtINR, fmtDate } from "@/lib/fraud-data";
import {
  Kpi,
  RiskBadge,
  MonitoringStatusBadge,
  AccountStatusBadge,
  RecommendationBadge,
  RiskGauge,
  Pill,
} from "@/components/risk-ui";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { InvestigationPanel } from "@/components/InvestigationPanel";
import { ChevronLeft, Snowflake, XCircle, FileSearch, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/monitored/$accountId")({
  head: ({ params }) => ({
    meta: [{ title: `${params.accountId} · Monitored account` }],
  }),
  loader: ({ params }) => {
    const a = monitoredAccounts.find((x) => x.accountId === params.accountId);
    if (!a) throw notFound();
    return a;
  },
  notFoundComponent: () => (
    <div className="p-10 text-center text-muted-foreground">Account not found.</div>
  ),
  errorComponent: ({ error }) => (
    <div className="p-10 text-center text-muted-foreground">Couldn’t load account. {error.message}</div>
  ),
  component: AccountDetail,
});

function AccountDetail() {
  const a = Route.useLoaderData();
  const [invOpen, setInvOpen] = useState(false);

  return (
    <div className="p-6 space-y-5">
      <Link to="/monitored" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-3.5 w-3.5" /> Back to monitored
      </Link>

      {/* Header */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <span>{a.customerId}</span><span>·</span><span>{a.accountId}</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{a.customerName}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <AccountStatusBadge status={a.accountStatus} />
              <MonitoringStatusBadge status={a.monitoringStatus} />
              <RiskBadge level={a.riskLevel} />
              <RecommendationBadge rec={a.recommendation} />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <RiskGauge score={a.riskScore} />
            <div className="flex flex-col gap-2">
              <Button onClick={() => setInvOpen(true)}>
                <FileSearch className="h-4 w-4 mr-1.5" /> Run investigation
              </Button>
              <Button
                variant="outline"
                className="border-[var(--danger)]/50 text-[var(--danger)] hover:bg-[color-mix(in_oklab,var(--danger)_15%,transparent)]"
                disabled={a.accountStatus !== "active"}
                onClick={() => toast.success(`Freeze requested on ${a.accountId}`)}
              >
                <Snowflake className="h-4 w-4 mr-1.5" /> Freeze account
              </Button>
              <Button
                variant="outline"
                className="border-[var(--critical)]/50 text-[var(--critical)] hover:bg-[color-mix(in_oklab,var(--critical)_15%,transparent)]"
                disabled={a.accountStatus === "closed"}
                onClick={() => toast.success(`Close requested on ${a.accountId}`)}
              >
                <XCircle className="h-4 w-4 mr-1.5" /> Close account
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Overview KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Kpi label="Balance" value={fmtINR(a.balance)} />
        <Kpi label="Exposure" value={fmtINR(a.exposure)} tone="danger" />
        <Kpi label="Total txns" value={a.totalTxns} />
        <Kpi label="Fraud-labeled" value={a.fraudTxns} tone="critical" />
        <Kpi label="Auth issues" value={a.authIssues} tone="warn" />
        <Kpi label="Avg IP risk" value={a.avgIpRisk.toFixed(2)} tone={a.avgIpRisk > 0.6 ? "danger" : "muted"} />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-muted">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="signals">Risk signals</TabsTrigger>
          <TabsTrigger value="investigation">Investigation</TabsTrigger>
          <TabsTrigger value="audit">Audit log</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <DetailCard title="Account">
              <Row k="Open date" v={a.openDate} />
              <Row k="KYC" v={<Pill tone={a.kyc === "verified" ? "ok" : a.kyc === "pending" ? "warn" : "danger"}>{a.kyc}</Pill>} />
              <Row k="City" v={a.city} />
              <Row k="Linked accounts" v={a.numAccounts} />
              <Row k="Recent device changes" v={a.recentDeviceChanges} />
            </DetailCard>
            <DetailCard title="Trigger">
              <Row k="Triggering txn" v={<code className="font-mono">{a.triggerTxnId}</code>} />
              <Row k="Reason" v={a.reason} />
              <Row k="Last risky txn" v={<code className="font-mono">{a.lastRiskyTxn}</code>} />
              <Row k="Last activity" v={fmtDate(a.lastActivity)} />
            </DetailCard>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <ol className="relative border-l border-border ml-2">
              {a.timeline.map((t) => (
                <li key={t.id} className="ml-4 pb-5">
                  <span className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full bg-[var(--info)] ring-4 ring-card" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{t.title}</span>
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{t.type.replace("_", " ")}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">{fmtDate(t.date)}</div>
                  <p className="mt-1 text-sm">{t.detail}</p>
                </li>
              ))}
            </ol>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <div className="rounded-lg border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Txn ID</th>
                  <th className="text-left px-3 py-2 font-medium">Date</th>
                  <th className="text-right px-3 py-2 font-medium">Amount</th>
                  <th className="text-left px-3 py-2 font-medium">Channel</th>
                  <th className="text-left px-3 py-2 font-medium">Auth</th>
                  <th className="text-left px-3 py-2 font-medium">Decision</th>
                  <th className="text-left px-3 py-2 font-medium">Fraud</th>
                  <th className="text-left px-3 py-2 font-medium">Risk</th>
                  <th className="text-right px-3 py-2 font-medium">Score</th>
                  <th className="text-left px-3 py-2 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {a.transactions.map((t) => (
                  <tr key={t.id} className="border-t border-border">
                    <td className="px-3 py-2 font-mono text-[12px]">{t.id}</td>
                    <td className="px-3 py-2 text-[12px] text-muted-foreground">{fmtDate(t.date)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmtINR(t.amount)}</td>
                    <td className="px-3 py-2">{t.channel}</td>
                    <td className="px-3 py-2">
                      <Pill tone={t.authStatus === "passed" ? "ok" : t.authStatus === "step_up" ? "warn" : "danger"}>{t.authStatus}</Pill>
                    </td>
                    <td className="px-3 py-2">
                      <Pill tone={t.decision === "allowed" ? "ok" : t.decision === "held" ? "warn" : "danger"}>{t.decision}</Pill>
                    </td>
                    <td className="px-3 py-2">
                      {t.fraudLabel ? <Pill tone="critical">fraud</Pill> : <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                    <td className="px-3 py-2"><RiskBadge level={t.riskLevel} /></td>
                    <td className="px-3 py-2 text-right tabular-nums">{t.riskScore}</td>
                    <td className="px-3 py-2 text-[12px] text-muted-foreground max-w-xs truncate">{t.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="signals" className="mt-4">
          <div className="grid md:grid-cols-2 gap-3">
            {a.signals.map((s) => (
              <div key={s.label} className="rounded-md border border-border bg-card p-3 flex items-start gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-md bg-[color-mix(in_oklab,var(--danger)_15%,transparent)] text-[var(--danger)]">
                  <AlertCircle className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{s.label}</span>
                    <RiskBadge level={s.severity} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="investigation" className="mt-4">
          <DetailCard title="Latest investigation output">
            <Row k="Recommendation" v={a.investigation.recommendation} />
            <div className="py-2">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Reasons</div>
              <ul className="space-y-1 text-sm">
                {a.investigation.reasons.map((r) => (
                  <li key={r} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--danger)]" />{r}</li>
                ))}
              </ul>
            </div>
            <div className="py-2">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Evidence</div>
              <div className="flex flex-wrap gap-1.5">
                {a.investigation.evidenceTxnIds.map((id) => (
                  <code key={id} className="rounded bg-muted px-2 py-0.5 text-[11px] font-mono">{id}</code>
                ))}
              </div>
            </div>
            <div className="py-2">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Next steps</div>
              <ol className="space-y-1 text-sm list-decimal list-inside">
                {a.investigation.nextSteps.map((s) => <li key={s}>{s}</li>)}
              </ol>
            </div>
          </DetailCard>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Time</th>
                  <th className="text-left px-3 py-2 font-medium">Actor</th>
                  <th className="text-left px-3 py-2 font-medium">Action</th>
                  <th className="text-left px-3 py-2 font-medium">Note</th>
                </tr>
              </thead>
              <tbody>
                {a.audit.map((row, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-3 py-2 text-[12px] text-muted-foreground">{fmtDate(row.date)}</td>
                    <td className="px-3 py-2 font-mono text-[12px]">{row.actor}</td>
                    <td className="px-3 py-2">{row.action}</td>
                    <td className="px-3 py-2 text-[12px] text-muted-foreground">{row.note ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      <InvestigationPanel
        open={invOpen}
        onOpenChange={setInvOpen}
        data={{
          agentName: "Account Investigation Agent",
          score: a.riskScore,
          riskLevel: a.riskLevel,
          recommendation: a.investigation.recommendation,
          summary: a.reason,
          reasons: a.investigation.reasons,
          evidenceTxnIds: a.investigation.evidenceTxnIds,
          nextSteps: a.investigation.nextSteps,
        }}
      />
    </div>
  );
}

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-2.5 text-sm font-semibold">{title}</div>
      <div className="p-4 divide-y divide-border">{children}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 first:pt-0 last:pb-0">
      <div className="text-xs text-muted-foreground">{k}</div>
      <div className="text-sm">{v}</div>
    </div>
  );
}