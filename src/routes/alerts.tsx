import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { fmtINR } from "@/lib/fraud-data";
import { fraudAlerts, riskOrder, type FraudAlert } from "@/lib/ops-data";
import {
  KPIStatCard,
  EvidenceStack,
  CaseTypeBadge,
  DecisionStatusBadge,
  RecommendedActionBadge,
  SLAIndicator,
  Pill,
} from "@/components/fraud-ui";
import { RiskBadge } from "@/components/risk-ui";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Search } from "lucide-react";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Fraud Alerts — Sentinel Ops" },
      { name: "description", content: "Alert triage queue for fraud analysts." },
    ],
  }),
  component: AlertsPage,
});

function AlertsPage() {
  const [q, setQ] = useState("");
  const [risk, setRisk] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const list = useMemo(() => {
    return fraudAlerts
      .filter(
        (a) =>
          (risk === "all" || a.risk === risk) &&
          (q.trim() === "" ||
            [a.id, a.customer, a.customerId, a.counterparty, a.mainReason].join(" ").toLowerCase().includes(q.toLowerCase())),
      )
      .sort((a, b) => riskOrder[a.risk] - riskOrder[b.risk] || a.slaMinutesLeft - b.slaMinutesLeft);
  }, [q, risk]);

  const openAlerts = fraudAlerts.length;
  const critical = fraudAlerts.filter((a) => a.risk === "critical").length;
  const moneyAtRisk = fraudAlerts.reduce((s, a) => s + a.amount, 0);
  const slaRisk = fraudAlerts.filter((a) => a.slaMinutesLeft <= 20).length;
  const avgAge = Math.round(fraudAlerts.reduce((s, a) => s + (Date.now() - new Date(a.openedAt).getTime()) / 60000, 0) / fraudAlerts.length);
  const unassigned = fraudAlerts.filter((a) => !a.assignedTo).length;
  const confirmedRate = 0.34;
  const fp = fraudAlerts.filter((a) => a.caseType === "false_positive_review").length;

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Fraud Alerts</h1>
        <p className="text-sm text-muted-foreground">Which alerts should I investigate first and why.</p>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        <KPIStatCard label="Open Alerts" value={openAlerts} tone="info" />
        <KPIStatCard label="Critical Alerts" value={critical} tone="critical" />
        <KPIStatCard label="Money at Risk" value={fmtINR(moneyAtRisk)} tone="danger" />
        <KPIStatCard label="Near SLA Breach" value={slaRisk} tone="warn" actionHint="Reassign quickly" />
        <KPIStatCard label="Avg Alert Age" value={`${avgAge}m`} tone="muted" />
        <KPIStatCard label="Unassigned" value={unassigned} tone="warn" />
        <KPIStatCard label="Confirmed Fraud Rate" value={`${Math.round(confirmedRate * 100)}%`} tone="ok" meaning="Last 7 days" />
        <KPIStatCard label="Likely False Positives" value={fp} tone="muted" actionHint="Resolve fast" />
      </section>

      <div className="rounded-lg border border-border bg-card p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search alert, customer, payee or transaction" className="h-9 pl-8" />
        </div>
        {(["all", "critical", "high", "medium", "low"] as const).map((r) => (
          <Button key={r} size="sm" variant={risk === r ? "default" : "outline"} onClick={() => setRisk(r)} className="h-8 capitalize">
            {r}
          </Button>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[28px_110px_140px_1fr_110px_90px_140px_1fr_110px_120px] gap-2 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
          <div />
          <div>Alert ID</div>
          <div>Case type</div>
          <div>Customer / Counterparty</div>
          <div className="text-right">Amount</div>
          <div>Risk</div>
          <div>Status</div>
          <div>Reason &amp; evidence</div>
          <div>SLA</div>
          <div>Assigned</div>
        </div>
        <div className="divide-y divide-border">
          {list.map((a) => (
            <div key={a.id}>
              <button
                onClick={() => setExpanded(expanded === a.id ? null : a.id)}
                className="grid w-full grid-cols-[28px_110px_140px_1fr_110px_90px_140px_1fr_110px_120px] gap-2 px-3 py-2.5 text-left text-sm hover:bg-accent/40"
              >
                <div className="text-muted-foreground">
                  {expanded === a.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
                <div className="font-mono text-xs">{a.id}</div>
                <div><CaseTypeBadge type={a.caseType} /></div>
                <div className="min-w-0">
                  <div className="font-medium truncate">{a.customer}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{a.counterparty} · {a.channel}</div>
                </div>
                <div className="text-right tabular-nums font-semibold">{fmtINR(a.amount)}</div>
                <div><RiskBadge level={a.risk} /></div>
                <div><DecisionStatusBadge decision={a.decision} /></div>
                <div className="min-w-0">
                  <div className="text-xs truncate">{a.mainReason}</div>
                  <div className="mt-0.5"><EvidenceStack items={a.evidence} max={4} /></div>
                </div>
                <div><SLAIndicator minutesLeft={a.slaMinutesLeft} compact /></div>
                <div className="text-xs">{a.assignedTo ?? <Pill tone="warn">Unassigned</Pill>}</div>
              </button>

              {expanded === a.id && (
                <AlertExpanded alert={a} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AlertExpanded({ alert: a }: { alert: FraudAlert }) {
  return (
    <div className="px-12 py-4 bg-background/40 border-t border-border space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <Section title="Alert summary">
          <p className="text-sm">{a.mainReason}</p>
          <div className="mt-2"><EvidenceStack items={a.evidence} max={20} /></div>
        </Section>
        <Section title="Recommended action">
          <RecommendedActionBadge action={a.recommendedAction} />
          <p className="text-[11px] text-muted-foreground mt-2">Similar prior cases: {a.similarPriorCases}</p>
        </Section>
        <Section title="Login activity">
          <p className="text-sm">{a.loginActivity}</p>
        </Section>
        <Section title="Device / IP">
          <p className="text-sm">{a.deviceIp}</p>
        </Section>
        <Section title="Linked transactions">
          <div className="flex flex-wrap gap-1">
            {a.linkedTxns.map((t) => <Pill key={t} tone="muted">{t}</Pill>)}
          </div>
        </Section>
        <Section title="Analyst note">
          <textarea placeholder="Add a note for handoff or audit…" className="w-full h-20 rounded-md border border-border bg-card p-2 text-sm" />
        </Section>
      </div>
      <div className="flex flex-wrap gap-2 pt-2">
        <Button size="sm">Open case</Button>
        <Button size="sm" variant="secondary">Assign to me</Button>
        <Button size="sm" variant="outline">Request OTP</Button>
        <Button size="sm" variant="outline">Mark genuine</Button>
        <Button size="sm" variant="destructive">Block / Freeze</Button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{title}</div>
      {children}
    </div>
  );
}