import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { amlClusters, fmtINR, patternTypeLabel, type AmlPatternType } from "@/lib/fraud-data";
import { Kpi, RiskBadge, Pill } from "@/components/risk-ui";
import { Button } from "@/components/ui/button";
import { TransferGraph } from "@/components/TransferGraph";
import { InvestigationPanel } from "@/components/InvestigationPanel";
import { FileSearch, GitBranch, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/aml")({
  head: () => ({
    meta: [
      { title: "AML monitoring · Sentinel Ops" },
      { name: "description", content: "Suspicious transfer patterns, exposure, counterparties, and compliance escalation." },
    ],
  }),
  component: AmlPage,
});

const patternTypes: AmlPatternType[] = [
  "structuring",
  "rapid_fund_movement",
  "circular_transfers",
  "mule_behavior",
  "dormant_reactivation",
  "high_risk_counterparty",
  "fan_out",
  "same_beneficiary_spread",
];

function AmlPage() {
  const [selectedId, setSelectedId] = useState(amlClusters[0].patternId);
  const [invOpen, setInvOpen] = useState(false);
  const [invData, setInvData] = useState<any>(null);

  const cluster = useMemo(
    () => amlClusters.find((c) => c.patternId === selectedId)!,
    [selectedId],
  );

  const totals = {
    clusters: amlClusters.length,
    txns: amlClusters.reduce((s, c) => s + c.txnCount, 0),
    exposure: amlClusters.reduce((s, c) => s + c.exposure, 0),
    esc: amlClusters.filter((c) => c.complianceRequired).length,
    top: Math.max(...amlClusters.map((c) => c.amlScore)),
  };

  const runAgent = (id: string) => {
    const c = amlClusters.find((x) => x.patternId === id)!;
    setInvData({
      agentName: "AML Agent",
      score: c.amlScore,
      riskLevel: c.agent.riskLevel,
      recommendation: c.agent.recommendation,
      summary: c.agent.summary,
      reasons: c.agent.reasons,
      evidenceTxnIds: c.agent.evidenceTxnIds,
      nextSteps: c.agent.nextSteps,
    });
    setInvOpen(true);
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AML monitoring</h1>
        <p className="text-sm text-muted-foreground">
          Suspicious transfer patterns, exposure, counterparties, and compliance escalation.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi label="AML clusters" value={totals.clusters} tone="info" />
        <Kpi label="AML-labeled txns" value={totals.txns} tone="warn" />
        <Kpi label="Total AML exposure" value={fmtINR(totals.exposure)} tone="danger" />
        <Kpi label="Compliance escalations" value={totals.esc} tone="critical" />
        <Kpi label="Highest risk score" value={totals.top} tone="critical" />
      </div>

      {/* Pattern type chips */}
      <div className="flex flex-wrap gap-1.5">
        {patternTypes.map((p) => {
          const count = amlClusters.filter((c) => c.patternType === p).length;
          return (
            <span
              key={p}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] ${
                count > 0
                  ? "border-border bg-card text-foreground"
                  : "border-border bg-muted/40 text-muted-foreground"
              }`}
            >
              <GitBranch className="h-3 w-3" />
              {patternTypeLabel[p]}
              <span className="font-mono text-muted-foreground">{count}</span>
            </span>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-4">
        <div className="space-y-3">
          <TransferGraph cluster={cluster} />

          <div className="rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <div className="text-sm font-semibold">Evidence preview</div>
              <Button size="sm" onClick={() => runAgent(cluster.patternId)}>
                <FileSearch className="h-3.5 w-3.5 mr-1.5" /> Run AML Agent
              </Button>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Txn ID</th>
                  <th className="text-right px-3 py-2 font-medium">Amount</th>
                  <th className="text-left px-3 py-2 font-medium">Receiver</th>
                  <th className="text-left px-3 py-2 font-medium">Channel</th>
                  <th className="text-left px-3 py-2 font-medium">Type</th>
                </tr>
              </thead>
              <tbody>
                {cluster.evidence.map((e) => (
                  <tr key={e.txnId} className="border-t border-border">
                    <td className="px-3 py-2 font-mono text-[12px]">{e.txnId}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmtINR(e.amount)}</td>
                    <td className="px-3 py-2 font-mono text-[12px]">{e.receiver}</td>
                    <td className="px-3 py-2">{e.channel}</td>
                    <td className="px-3 py-2"><Pill tone="danger">{e.type}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Priority clusters sidebar */}
        <aside className="rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 text-sm font-semibold">
            <ShieldAlert className="h-4 w-4 text-[var(--danger)]" /> Priority AML clusters
          </div>
          <div className="divide-y divide-border max-h-[700px] overflow-y-auto">
            {amlClusters.map((c) => {
              const active = c.patternId === selectedId;
              return (
                <div
                  key={c.patternId}
                  className={`p-3 cursor-pointer ${active ? "bg-muted/40 border-l-2 border-l-[var(--info)]" : "hover:bg-muted/20"}`}
                  onClick={() => setSelectedId(c.patternId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{c.customerName}</div>
                    <div className="text-sm font-semibold tabular-nums">{c.amlScore}</div>
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono">{c.customerId} · {c.accountId}</div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <RiskBadge level={c.riskLevel} />
                    <Pill tone="warn">{patternTypeLabel[c.patternType]}</Pill>
                  </div>
                  <div className="mt-2 text-[11px] text-muted-foreground line-clamp-2">{c.patternSummary}</div>
                  <div className="mt-2 grid grid-cols-3 gap-1.5 text-[11px]">
                    <div><div className="text-muted-foreground">Txns</div><div className="tabular-nums">{c.txnCount}</div></div>
                    <div><div className="text-muted-foreground">Window</div><div>{c.timeWindow}</div></div>
                    <div><div className="text-muted-foreground">Exposure</div><div className="tabular-nums">{fmtINR(c.exposure)}</div></div>
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    <Button size="sm" variant="outline" className="h-7 text-xs flex-1"
                      onClick={(e) => { e.stopPropagation(); setSelectedId(c.patternId); }}>
                      View graph
                    </Button>
                    <Button size="sm" className="h-7 text-xs flex-1"
                      onClick={(e) => { e.stopPropagation(); runAgent(c.patternId); }}>
                      Run agent
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      {/* AML cases table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-4 py-2.5 text-sm font-semibold">AML cases</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Pattern</th>
                <th className="text-left px-3 py-2 font-medium">Customer / account</th>
                <th className="text-left px-3 py-2 font-medium">Type</th>
                <th className="text-right px-3 py-2 font-medium">Exposure</th>
                <th className="text-right px-3 py-2 font-medium">Txns</th>
                <th className="text-right px-3 py-2 font-medium">Counterparties</th>
                <th className="text-left px-3 py-2 font-medium">Window</th>
                <th className="text-left px-3 py-2 font-medium">Channels</th>
                <th className="text-right px-3 py-2 font-medium">AML score</th>
                <th className="text-left px-3 py-2 font-medium">Risk</th>
                <th className="text-left px-3 py-2 font-medium">Compliance</th>
                <th className="text-right px-3 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {amlClusters.map((c) => (
                <tr
                  key={c.patternId}
                  className={`border-t border-border cursor-pointer hover:bg-muted/30 ${c.patternId === selectedId ? "bg-muted/30" : ""}`}
                  onClick={() => setSelectedId(c.patternId)}
                >
                  <td className="px-3 py-2 font-mono text-[12px]">{c.patternId}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{c.customerName}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">{c.accountId}</div>
                  </td>
                  <td className="px-3 py-2"><Pill tone="warn">{patternTypeLabel[c.patternType]}</Pill></td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtINR(c.exposure)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{c.txnCount}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{c.counterparties}</td>
                  <td className="px-3 py-2">{c.timeWindow}</td>
                  <td className="px-3 py-2 text-[12px]">{c.channels.join(", ")}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold">{c.amlScore}</td>
                  <td className="px-3 py-2"><RiskBadge level={c.riskLevel} /></td>
                  <td className="px-3 py-2">
                    {c.complianceRequired
                      ? <Pill tone="critical">required</Pill>
                      : <Pill tone="ok">not required</Pill>}
                  </td>
                  <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => runAgent(c.patternId)}>
                      Run agent
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <InvestigationPanel open={invOpen} onOpenChange={setInvOpen} data={invData} />
    </div>
  );
}