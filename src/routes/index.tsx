import { createFileRoute, Link } from "@tanstack/react-router";
import { fmtINR } from "@/lib/fraud-data";
import { fraudAlerts, reviewCases, merchants, opsKpis } from "@/lib/ops-data";
import {
  KPIStatCard,
  ActionRequiredCard,
  ChartCard,
  HBarList,
  Funnel,
  LiveDot,
  CaseTypeBadge,
  SLAIndicator,
  RecommendedActionBadge,
} from "@/components/fraud-ui";
import { ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fraud Command Center — Sentinel Ops" },
      { name: "description", content: "Real-time fraud command center for bank fraud analysts." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const k = opsKpis();
  const updated = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const highCritical = fraudAlerts.filter((a) => a.risk === "critical" || a.risk === "high");
  const moneyHeld = highCritical.reduce((s, a) => s + a.amount, 0);
  const oldestSla = Math.min(...highCritical.map((a) => a.slaMinutesLeft));
  const amlAlert = fraudAlerts.find((a) => a.caseType === "aml_suspicious")!;
  const merchantTop = [...merchants].sort((a, b) => b.exposure - a.exposure)[0];
  const fpAlert = fraudAlerts.find((a) => a.caseType === "false_positive_review")!;

  return (
    <div className="p-6 space-y-6">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Fraud Command Center</h1>
          <p className="text-sm text-muted-foreground">What needs your attention right now.</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <LiveDot label="Live monitoring · All channels" />
          <span>· Last updated {updated}</span>
        </div>
      </div>

      {/* Real-time risk summary strip */}
      <section className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        <KPIStatCard label="Open High/Critical" value={k.openCritical} meaning="Cases needing analyst attention now." actionHint="Triage in Alerts" tone="critical" />
        <KPIStatCard label="Money at Risk" value={fmtINR(k.moneyAtRisk)} meaning="Funds held, blocked or under review." tone="danger" />
        <KPIStatCard label="SLA Breach Risk" value={k.slaAtRisk} meaning="Alerts within 20 min of breach." actionHint="Reassign" tone="warn" />
        <KPIStatCard label="AML Escalations" value={k.amlPending} meaning="Cases queued for compliance." tone="info" />
        <KPIStatCard label="Waiting Decision" value={k.reviewPending} meaning="Pending human review." tone="warn" />
        <KPIStatCard label="Verification Pending" value={k.verificationPending} meaning="Customer OTP/MFA in flight." tone="info" />
        <KPIStatCard label="False Positives" value={k.falsePositives} meaning="Likely genuine cases held — review fast." actionHint="Reduce friction" tone="muted" />
      </section>

      {/* Priority action cards */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Priority actions</h2>
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
          <ActionRequiredCard
            tone="critical"
            title="Immediate fraud priority"
            headline={`${highCritical.length} high-risk transactions are currently held for review`}
            stats={[
              { label: "Money at risk", value: fmtINR(moneyHeld) },
              { label: "Oldest SLA", value: oldestSla < 0 ? `Breached ${Math.abs(oldestSla)}m` : `${oldestSla}m left` },
              { label: "Customers affected", value: highCritical.length },
              { label: "Top reason", value: <span className="text-xs">New device + new payee</span> },
            ]}
            topEvidence={["New device", "4 failed logins", "Recent beneficiary", "Customer confirmed fraud"]}
            action="Freeze & verify"
            footer={<Link to="/alerts" className="text-xs text-[var(--info)] inline-flex items-center gap-1 hover:underline">Open fraud alerts <ArrowUpRight className="h-3 w-3" /></Link>}
          />
          <ActionRequiredCard
            tone="danger"
            title="AML priority"
            headline="Structuring pattern detected across 11 linked transactions"
            stats={[
              { label: "Total amount", value: fmtINR(amlAlert.amount) },
              { label: "Linked accounts", value: 1 },
              { label: "Compliance", value: "Awaiting" },
              { label: "Channel", value: amlAlert.channel },
            ]}
            topEvidence={amlAlert.evidence}
            action="Send to Compliance"
            footer={<Link to="/aml" className="text-xs text-[var(--info)] inline-flex items-center gap-1 hover:underline">Open AML cluster <ArrowUpRight className="h-3 w-3" /></Link>}
          />
          <ActionRequiredCard
            tone="warn"
            title="Merchant risk priority"
            headline={`${merchantTop.name} has abnormal chargeback activity`}
            stats={[
              { label: "Customers affected", value: merchantTop.customersAffected },
              { label: "Chargeback rate", value: `${merchantTop.chargebackRate}%` },
              { label: "Exposure", value: fmtINR(merchantTop.exposure) },
              { label: "Onboarded", value: `${merchantTop.onboardingDays}d ago` },
            ]}
            topEvidence={merchantTop.evidence}
            action="Escalate"
            footer={<Link to="/merchants" className="text-xs text-[var(--info)] inline-flex items-center gap-1 hover:underline">Open merchant <ArrowUpRight className="h-3 w-3" /></Link>}
          />
          <ActionRequiredCard
            tone="info"
            title="False positive pressure"
            headline="High-value verified payments are being held too often"
            stats={[
              { label: "Likely genuine", value: 6 },
              { label: "Business impact", value: "₹12.4L delayed" },
              { label: "Avg hold time", value: "23 min" },
              { label: "Top cause", value: <span className="text-xs">Amount rule</span> },
            ]}
            topEvidence={["Possible false positive", "Trusted device", "Verified merchant"]}
            action="Review thresholds"
            footer={<Link to="/review" className="text-xs text-[var(--info)] inline-flex items-center gap-1 hover:underline">Open review queue <ArrowUpRight className="h-3 w-3" /></Link>}
          />
        </div>
      </section>

      {/* Charts */}
      <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <ChartCard title="Cases by risk type" subtitle="Where work is concentrated today">
          <HBarList
            items={[
              { label: "Account Takeover", value: 14, tone: "critical" },
              { label: "Unauthorized Transaction", value: 11, tone: "critical" },
              { label: "Merchant Fraud", value: 9, tone: "danger" },
              { label: "AML Suspicious", value: 7, tone: "info" },
              { label: "APP Scam", value: 5, tone: "danger" },
              { label: "Card Testing", value: 4, tone: "warn" },
              { label: "Customer Risk", value: 3, tone: "warn" },
            ]}
          />
        </ChartCard>
        <ChartCard title="Money at risk by case type" subtitle="Financial exposure right now">
          <HBarList
            valueFmt={(n) => fmtINR(n)}
            items={[
              { label: "Unauthorized Transaction", value: 1840000, tone: "critical" },
              { label: "Merchant Fraud", value: 1840000, tone: "danger" },
              { label: "AML Suspicious", value: 540000, tone: "info" },
              { label: "Account Takeover", value: 415000, tone: "critical" },
              { label: "APP Scam", value: 320000, tone: "danger" },
              { label: "Card Testing", value: 18000, tone: "warn" },
            ]}
          />
        </ChartCard>
        <ChartCard title="Review queue by SLA" subtitle="On time vs. breach risk">
          <HBarList
            items={[
              { label: "On time", value: 28, tone: "ok" },
              { label: "Warning (<20m)", value: 7, tone: "warn" },
              { label: "Breached", value: 2, tone: "critical" },
            ]}
          />
        </ChartCard>
        <ChartCard title="Alert decision funnel" subtitle="Last 24h">
          <Funnel
            stages={[
              { label: "Screened", value: 184320, tone: "info" },
              { label: "Alerts created", value: 412, tone: "info" },
              { label: "Held for review", value: 96, tone: "warn" },
              { label: "Confirmed fraud", value: 18, tone: "critical" },
              { label: "False positive", value: 41, tone: "muted" },
            ]}
          />
        </ChartCard>
        <ChartCard title="Fraud outcome trend" subtitle="Decision quality, last 7 days">
          <HBarList
            items={[
              { label: "Confirmed Fraud", value: 76, tone: "critical" },
              { label: "Genuine / False positive", value: 142, tone: "ok" },
              { label: "Suspicious", value: 38, tone: "warn" },
              { label: "Inconclusive", value: 12, tone: "muted" },
            ]}
          />
        </ChartCard>
        <ChartCard title="Fraud prevented today" subtitle="Estimated loss avoided">
          <div className="space-y-3">
            <div>
              <div className="text-3xl font-semibold tabular-nums">{fmtINR(8420000)}</div>
              <div className="text-[11px] text-muted-foreground">vs. ₹6.1L confirmed fraud loss · ₹2.3L customer refunds</div>
            </div>
            <HBarList
              valueFmt={(n) => fmtINR(n)}
              items={[
                { label: "Blocked at decision", value: 5200000, tone: "ok" },
                { label: "Held + verified out", value: 2120000, tone: "ok" },
                { label: "Reversed", value: 1100000, tone: "warn" },
              ]}
            />
          </div>
        </ChartCard>
      </section>

      {/* Priority tables */}
      <section className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <div className="text-sm font-semibold">Cases needing immediate action</div>
            <Link to="/review" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              Open queue <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {reviewCases.slice(0, 4).map((c) => (
              <div key={c.id} className="px-4 py-3 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span>{c.customer}</span>
                    <span className="text-[11px] text-muted-foreground font-mono">{c.id}</span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <CaseTypeBadge type={c.caseType} />
                    <span className="text-[11px] text-muted-foreground truncate">{c.mainReason}</span>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-sm tabular-nums font-semibold">{fmtINR(c.amount)}</div>
                  <SLAIndicator minutesLeft={c.slaMinutesLeft} compact />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <div className="text-sm font-semibold">Possible false positives to resolve fast</div>
            <Link to="/review" className="text-xs text-muted-foreground hover:text-foreground">Review</Link>
          </div>
          <div className="px-4 py-3 text-sm space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium">{fpAlert.customer}</div>
                <div className="text-[11px] text-muted-foreground truncate">{fpAlert.mainReason}</div>
              </div>
              <div className="text-right">
                <div className="text-sm tabular-nums font-semibold">{fmtINR(fpAlert.amount)}</div>
                <RecommendedActionBadge action={fpAlert.recommendedAction} />
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground">
              Verified merchant + trusted device. Customer-side delay impacts NPS.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
