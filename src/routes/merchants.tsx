import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { fmtINR } from "@/lib/fraud-data";
import { merchants, riskOrder, type MerchantRisk } from "@/lib/ops-data";
import {
  KPIStatCard,
  EvidenceStack,
  RecommendedActionBadge,
  ChartCard,
  HBarList,
  Pill,
} from "@/components/fraud-ui";
import { RiskBadge } from "@/components/risk-ui";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export const Route = createFileRoute("/merchants")({
  head: () => ({
    meta: [
      { title: "Merchant Risk — Sentinel Ops" },
      { name: "description", content: "Merchant fraud and cluster investigation." },
    ],
  }),
  component: MerchantsPage,
});

function MerchantsPage() {
  const [active, setActive] = useState<MerchantRisk | null>(null);
  const sorted = [...merchants].sort((a, b) => riskOrder[a.risk] - riskOrder[b.risk] || b.exposure - a.exposure);
  const top = sorted.slice(0, 3);

  const highRisk = merchants.filter((m) => m.risk === "high" || m.risk === "critical").length;
  const exposure = merchants.reduce((s, m) => s + m.exposure, 0);
  const customersAffected = merchants.reduce((s, m) => s + m.customersAffected, 0);
  const avgCB = (merchants.reduce((s, m) => s + m.chargebackRate, 0) / merchants.length).toFixed(1);
  const avgRev = (merchants.reduce((s, m) => s + m.reversalRate, 0) / merchants.length).toFixed(1);
  const newReview = merchants.filter((m) => m.kyc === "under_review").length;
  const spike = merchants.filter((m) => m.volumeSpike >= 3).length;
  const pending = merchants.reduce((s, m) => s + m.linkedCases, 0);

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Merchant Risk</h1>
        <p className="text-sm text-muted-foreground">Is this merchant creating risk across many customers.</p>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        <KPIStatCard label="High-Risk Merchants" value={highRisk} tone="critical" />
        <KPIStatCard label="Merchant Fraud Exposure" value={fmtINR(exposure)} tone="danger" />
        <KPIStatCard label="Customers Affected" value={customersAffected} tone="warn" />
        <KPIStatCard label="Avg Chargeback Rate" value={`${avgCB}%`} tone="warn" />
        <KPIStatCard label="Avg Reversal Rate" value={`${avgRev}%`} tone="muted" />
        <KPIStatCard label="New Merchants Under Review" value={newReview} tone="info" />
        <KPIStatCard label="Suspicious Volume Spike" value={spike} tone="danger" meaning="≥3x baseline" />
        <KPIStatCard label="Merchant Cases Pending" value={pending} tone="warn" />
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Priority merchants</h2>
        <div className="grid md:grid-cols-3 gap-3">
          {top.map((m) => (
            <button
              key={m.id}
              onClick={() => setActive(m)}
              className="rounded-lg border border-border bg-card p-4 text-left space-y-3 hover:bg-accent/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold">{m.name}</div>
                  <div className="text-[11px] text-muted-foreground">{m.category} · onboarded {m.onboardingDays}d ago</div>
                </div>
                <RiskBadge level={m.risk} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <Stat label="Money at risk" value={fmtINR(m.exposure)} />
                <Stat label="Customers affected" value={m.customersAffected} />
                <Stat label="Chargeback rate" value={`${m.chargebackRate}%`} />
                <Stat label="Volume spike" value={`${m.volumeSpike}x`} />
              </div>
              <EvidenceStack items={m.evidence} max={6} />
              <div className="flex items-center justify-between">
                <Pill tone={m.kyc === "verified" ? "ok" : m.kyc === "under_review" ? "warn" : "critical"}>{m.kyc.replace("_", " ")}</Pill>
                <RecommendedActionBadge action={m.recommendedAction} />
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <ChartCard title="Top merchants by money at risk">
          <HBarList
            valueFmt={(n) => fmtINR(n)}
            items={sorted.map((m) => ({
              label: m.name,
              value: m.exposure,
              tone: m.risk === "critical" ? "critical" : m.risk === "high" ? "danger" : m.risk === "medium" ? "warn" : "ok",
            }))}
          />
        </ChartCard>
        <ChartCard title="Customers affected by merchant">
          <HBarList
            items={sorted.map((m) => ({
              label: m.name,
              value: m.customersAffected,
              tone: m.risk === "critical" ? "critical" : m.risk === "high" ? "danger" : "info",
            }))}
          />
        </ChartCard>
      </section>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_110px_90px_90px_100px_100px_100px_90px_90px_140px_90px_130px] gap-2 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
          <div>Merchant</div>
          <div>Category</div>
          <div>KYC</div>
          <div className="text-right">Onboard</div>
          <div className="text-right">Volume</div>
          <div className="text-right">Customers</div>
          <div className="text-right">Avg ticket</div>
          <div className="text-right">Chargeback</div>
          <div className="text-right">Reversal</div>
          <div className="text-right">Linked</div>
          <div>Main concern</div>
          <div>Risk</div>
          <div>Action</div>
        </div>
        <div className="divide-y divide-border">
          {sorted.map((m) => (
            <button
              key={m.id}
              onClick={() => setActive(m)}
              className="grid w-full grid-cols-[1fr_120px_110px_90px_90px_100px_100px_100px_90px_90px_140px_90px_130px] gap-2 px-3 py-2.5 text-left text-sm hover:bg-accent/30"
            >
              <div className="font-medium truncate">{m.name}</div>
              <div className="text-xs truncate">{m.category}</div>
              <div><Pill tone={m.kyc === "verified" ? "ok" : "warn"}>{m.kyc.replace("_", " ")}</Pill></div>
              <div className="text-right tabular-nums text-xs">{m.onboardingDays}d</div>
              <div className="text-right tabular-nums text-xs">{m.txnVolume.toLocaleString()}</div>
              <div className="text-right tabular-nums text-xs">{m.uniqueCustomers.toLocaleString()}</div>
              <div className="text-right tabular-nums text-xs">{fmtINR(m.avgTicket)}</div>
              <div className="text-right tabular-nums text-xs">{m.chargebackRate}%</div>
              <div className="text-right tabular-nums text-xs">{m.reversalRate}%</div>
              <div className="text-right tabular-nums text-xs">{m.linkedCases}</div>
              <div className="text-xs truncate">{m.mainConcern}</div>
              <div><RiskBadge level={m.risk} /></div>
              <div><RecommendedActionBadge action={m.recommendedAction} /></div>
            </button>
          ))}
        </div>
      </div>

      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          {active && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-base">
                  <span>{active.name}</span>
                  <button onClick={() => setActive(null)} className="ml-auto text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4 text-sm">
                <div className="grid grid-cols-3 gap-2">
                  <Stat label="Risk" value={<RiskBadge level={active.risk} />} />
                  <Stat label="KYC" value={active.kyc.replace("_", " ")} />
                  <Stat label="Onboarded" value={`${active.onboardingDays}d ago`} />
                  <Stat label="Volume" value={active.txnVolume.toLocaleString()} />
                  <Stat label="Customers" value={active.uniqueCustomers.toLocaleString()} />
                  <Stat label="Avg ticket" value={fmtINR(active.avgTicket)} />
                  <Stat label="Chargeback" value={`${active.chargebackRate}%`} />
                  <Stat label="Reversal" value={`${active.reversalRate}%`} />
                  <Stat label="Exposure" value={fmtINR(active.exposure)} />
                </div>
                <Section title="Main concern">{active.mainConcern}</Section>
                <Section title="Evidence"><EvidenceStack items={active.evidence} max={20} /></Section>
                <Section title="Linked fraud cases">{active.linkedCases} cases · {active.customersAffected} customers affected</Section>
                <Section title="Analyst recommendation"><RecommendedActionBadge action={active.recommendedAction} /></Section>
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button size="sm" className="flex-1">Escalate</Button>
                  <Button size="sm" variant="secondary" className="flex-1">Hold settlements</Button>
                  <Button size="sm" variant="destructive" className="flex-1">Freeze merchant</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-background/40 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{title}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}