import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { monitoredAccounts, amlClusters, fmtINR } from "@/lib/fraud-data";
import { Kpi, RiskBadge, MonitoringStatusBadge } from "@/components/risk-ui";
import { ArrowUpRight, Shield, GitBranch } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sentinel Ops — Fraud & AML Console" },
      { name: "description", content: "Operational console for post-transaction monitoring and AML investigation." },
      { property: "og:title", content: "Sentinel Ops" },
      { property: "og:description", content: "Fraud and AML operations console." },
    ],
  }),
  component: Index,
});

function Index() {
  const totalExposure = monitoredAccounts.reduce((s, a) => s + a.exposure, 0);
  const reviewReq = monitoredAccounts.filter((a) => a.monitoringStatus === "review_required").length;
  const freezeRec = monitoredAccounts.filter((a) => a.monitoringStatus === "freeze_recommended").length;
  const frozen = monitoredAccounts.filter((a) => a.monitoringStatus === "frozen").length;

  const amlExposure = amlClusters.reduce((s, c) => s + c.exposure, 0);
  const compEsc = amlClusters.filter((c) => c.complianceRequired).length;

  const topRisk = [...monitoredAccounts].sort((a, b) => b.riskScore - a.riskScore).slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Operations overview</h1>
        <p className="text-sm text-muted-foreground">
          Live queues for post-transaction monitoring and AML investigation.
        </p>
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Monitored accounts</h2>
          <Link to="/monitored" className="text-xs text-[var(--info)] inline-flex items-center gap-1 hover:underline">
            Open queue <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Kpi label="Total monitored" value={monitoredAccounts.length} tone="info" />
          <Kpi label="Review required" value={reviewReq} tone="warn" />
          <Kpi label="Freeze recommended" value={freezeRec} tone="danger" />
          <Kpi label="Frozen" value={frozen} tone="critical" />
          <Kpi label="Total exposure" value={fmtINR(totalExposure)} tone="muted" hint="Sum of at-risk balances" />
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">AML monitoring</h2>
          <Link to="/aml" className="text-xs text-[var(--info)] inline-flex items-center gap-1 hover:underline">
            Open investigations <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Kpi label="AML clusters" value={amlClusters.length} tone="info" />
          <Kpi label="AML-labeled txns" value={amlClusters.reduce((s, c) => s + c.txnCount, 0)} tone="warn" />
          <Kpi label="AML exposure" value={fmtINR(amlExposure)} tone="danger" />
          <Kpi label="Compliance escalations" value={compEsc} tone="critical" />
          <Kpi label="Highest AML score" value={Math.max(...amlClusters.map((c) => c.amlScore))} tone="critical" />
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Shield className="h-4 w-4 text-[var(--info)]" /> Top risk monitored
            </div>
            <Link to="/monitored" className="text-xs text-muted-foreground hover:text-foreground">View all</Link>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {topRisk.map((a) => (
                <tr key={a.accountId} className="border-t border-border">
                  <td className="px-4 py-2.5">
                    <Link
                      to="/monitored/$accountId"
                      params={{ accountId: a.accountId }}
                      className="font-medium hover:underline"
                    >
                      {a.customerName}
                    </Link>
                    <div className="text-[11px] text-muted-foreground font-mono">{a.accountId}</div>
                  </td>
                  <td className="px-4 py-2.5"><RiskBadge level={a.riskLevel} /></td>
                  <td className="px-4 py-2.5"><MonitoringStatusBadge status={a.monitoringStatus} /></td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmtINR(a.exposure)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <GitBranch className="h-4 w-4 text-[var(--warn)]" /> Priority AML clusters
            </div>
            <Link to="/aml" className="text-xs text-muted-foreground hover:text-foreground">View all</Link>
          </div>
          <div className="divide-y divide-border">
            {amlClusters.map((c) => (
              <div key={c.patternId} className="px-4 py-3 flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-md bg-muted text-xs font-mono">{c.amlScore}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{c.patternLabel}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{c.customerName} · {c.accountId} · {c.txnCount} txns · {c.timeWindow}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm tabular-nums">{fmtINR(c.exposure)}</div>
                  <RiskBadge level={c.riskLevel} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
