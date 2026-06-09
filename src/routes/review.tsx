import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { fmtINR } from "@/lib/fraud-data";
import { reviewCases, riskOrder, actionLabel, type ReviewCase } from "@/lib/ops-data";
import {
  KPIStatCard,
  EvidenceStack,
  CaseTypeBadge,
  RecommendedActionBadge,
  SLAIndicator,
  Pill,
} from "@/components/fraud-ui";
import { RiskBadge } from "@/components/risk-ui";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "Human Review — Sentinel Ops" },
      { name: "description", content: "Decision workspace for fraud analysts." },
    ],
  }),
  component: ReviewPage,
});

const tabs = [
  { id: "all", label: "All Cases" },
  { id: "critical", label: "Critical" },
  { id: "high", label: "High Risk" },
  { id: "aml", label: "AML Review" },
  { id: "merchant", label: "Merchant Risk" },
  { id: "ato", label: "Account Takeover" },
  { id: "verification", label: "Verification Pending" },
  { id: "sla", label: "SLA Risk" },
  { id: "fp", label: "Possible False Positive" },
] as const;

function ReviewPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("all");
  const [active, setActive] = useState<ReviewCase | null>(null);

  const list = useMemo(() => {
    return reviewCases
      .filter((c) => {
        switch (tab) {
          case "critical": return c.risk === "critical";
          case "high": return c.risk === "high";
          case "aml": return c.caseType === "aml_suspicious";
          case "merchant": return c.caseType === "merchant_fraud";
          case "ato": return c.caseType === "account_takeover";
          case "verification": return c.verificationPending;
          case "sla": return c.slaMinutesLeft <= 20;
          case "fp": return c.caseType === "false_positive_review";
          default: return true;
        }
      })
      .sort((a, b) => riskOrder[a.risk] - riskOrder[b.risk] || a.slaMinutesLeft - b.slaMinutesLeft);
  }, [tab]);

  const pending = reviewCases.filter((c) => c.status !== "resolved").length;
  const critical = reviewCases.filter((c) => c.risk === "critical").length;
  const slaRisk = reviewCases.filter((c) => c.slaMinutesLeft <= 20).length;
  const verification = reviewCases.filter((c) => c.verificationPending).length;

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Human Review</h1>
        <p className="text-sm text-muted-foreground">What decision should I make on this case.</p>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        <KPIStatCard label="Pending Decisions" value={pending} tone="warn" />
        <KPIStatCard label="Critical Cases" value={critical} tone="critical" />
        <KPIStatCard label="SLA Breach Risk" value={slaRisk} tone="warn" actionHint="Prioritise now" />
        <KPIStatCard label="Avg Decision Time" value="6m 12s" tone="muted" />
        <KPIStatCard label="Resolved Today" value={42} tone="ok" />
        <KPIStatCard label="Verification Pending" value={verification} tone="info" />
        <KPIStatCard label="Compliance Escalations" value={3} tone="info" />
        <KPIStatCard label="False Positives Resolved" value={11} tone="muted" />
      </section>

      <div className="flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
              tab === t.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-accent/40"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {list.map((c) => (
          <div key={c.id} className="rounded-lg border border-border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-xs font-mono text-muted-foreground">{c.id}</div>
                <div className="text-sm font-semibold">{c.customer}</div>
              </div>
              <Pill tone={c.priority === "p1" ? "critical" : c.priority === "p2" ? "warn" : "muted"}>{c.priority.toUpperCase()}</Pill>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <CaseTypeBadge type={c.caseType} />
              <RiskBadge level={c.risk} />
              <SLAIndicator minutesLeft={c.slaMinutesLeft} compact />
            </div>
            <div className="text-xs leading-snug">{c.mainReason}</div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Evidence ({c.evidenceCount})</div>
              <EvidenceStack items={c.evidence} max={6} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-md border border-border bg-background/40 px-2 py-1">
                <div className="text-muted-foreground">Money at risk</div>
                <div className="font-semibold tabular-nums">{fmtINR(c.amount)}</div>
              </div>
              <div className="rounded-md border border-border bg-background/40 px-2 py-1">
                <div className="text-muted-foreground">Assigned</div>
                <div className="font-semibold">{c.assignedTo}</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <RecommendedActionBadge action={c.recommendedAction} />
              <Button size="sm" onClick={() => setActive(c)}>Take action</Button>
            </div>
          </div>
        ))}
      </div>

      <DecisionModal active={active} onClose={() => setActive(null)} />
    </div>
  );
}

function DecisionModal({ active, onClose }: { active: ReviewCase | null; onClose: () => void }) {
  const [outcome, setOutcome] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  return (
    <Dialog open={!!active} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        {active && (
          <>
            <DialogHeader>
              <DialogTitle>Decision · {active.id} · {active.customer}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <div className="rounded-md border border-border bg-background/40 p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">AI recommendation</div>
                <div className="mt-1 text-sm">
                  {`"${actionLabel[active.recommendedAction]}" — based on ${active.evidenceCount} evidence signals.`}
                </div>
                <div className="mt-2"><EvidenceStack items={active.evidence} max={20} /></div>
              </div>

              <div>
                <div className="text-xs uppercase text-muted-foreground mb-1">Customer impact</div>
                <div className="text-sm rounded-md border border-[var(--warn)]/50 bg-[var(--warn)]/10 p-2">
                  {active.customerImpact}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase text-muted-foreground mb-1">Your action</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {["Allow", "Request OTP/MFA", "Hold Transaction", "Block Transaction", "Freeze Account", "Escalate", "Send to Compliance", "Mark Genuine", "Mark Fraud", "Mark Suspicious", "Request Documents", "Add Note"].map((a) => (
                    <Button key={a} size="sm" variant="outline" className="h-8 text-xs justify-start">{a}</Button>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs uppercase text-muted-foreground mb-1">Final outcome</div>
                  <div className="flex flex-wrap gap-1.5">
                    {["Fraud", "Genuine", "Suspicious", "Inconclusive"].map((o) => (
                      <button
                        key={o}
                        onClick={() => setOutcome(o)}
                        className={`rounded-md border px-2 py-1 text-xs ${outcome === o ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase text-muted-foreground mb-1">Feedback type</div>
                  <div className="flex flex-wrap gap-1.5">
                    {["True Positive", "False Positive", "True Negative", "False Negative"].map((f) => (
                      <button
                        key={f}
                        onClick={() => setFeedback(f)}
                        className={`rounded-md border px-2 py-1 text-xs ${feedback === f ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs uppercase text-muted-foreground mb-1">Analyst note &amp; reason code</div>
                <textarea className="w-full h-20 rounded-md border border-border bg-card p-2 text-sm" placeholder="Reason code + free-text note for audit…" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button>Submit decision</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}