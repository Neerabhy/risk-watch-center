import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { fmtINR } from "@/lib/fraud-data";
import {
  liveTransactions,
  type LiveTransaction,
  type Decision,
  decisionLabel,
} from "@/lib/ops-data";
import {
  KPIStatCard,
  EvidenceStack,
  DecisionStatusBadge,
  RecommendedActionBadge,
  LiveDot,
  Pill,
} from "@/components/fraud-ui";
import { RiskBadge } from "@/components/risk-ui";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Play, Pause, StepForward, RotateCcw, X } from "lucide-react";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "Live Transactions — Sentinel Ops" },
      { name: "description", content: "Real-time fraud decision monitoring across channels." },
    ],
  }),
  component: LivePage,
});

type StreamMode = "normal" | "mixed" | "fraud_spike" | "aml_replay" | "fp_review";
const modeLabel: Record<StreamMode, string> = {
  normal: "Normal Traffic",
  mixed: "Mixed Risk Traffic",
  fraud_spike: "Fraud Spike",
  aml_replay: "AML Pattern Replay",
  fp_review: "High False Positive Review",
};

function genTxn(idNum: number, mode: StreamMode): LiveTransaction {
  // sample randomly with weights per mode
  const pool = liveTransactions;
  let pick: LiveTransaction;
  const r = Math.random();
  if (mode === "fraud_spike") {
    pick = pool.find((p) => p.risk === "critical" || p.risk === "high")!;
  } else if (mode === "aml_replay") {
    pick = pool.find((p) => p.evidence.includes("Structuring pattern"))!;
  } else if (mode === "fp_review") {
    pick = pool.find((p) => p.evidence.includes("Possible false positive"))!;
  } else if (mode === "normal") {
    pick = pool.filter((p) => p.risk === "low")[Math.floor(r * 2) % 2];
  } else {
    pick = pool[Math.floor(r * pool.length)];
  }
  return { ...pick, id: `TXN-${idNum}`, time: new Date().toISOString() };
}

function LivePage() {
  const [running, setRunning] = useState(true);
  const [mode, setMode] = useState<StreamMode>("mixed");
  const [rows, setRows] = useState<LiveTransaction[]>(liveTransactions);
  const [selected, setSelected] = useState<LiveTransaction | null>(null);
  const counter = useRef(20300);
  const t = useRef<number | null>(null);

  const tick = () => {
    counter.current += 1;
    setRows((r) => [genTxn(counter.current, mode), ...r].slice(0, 60));
  };

  useEffect(() => {
    if (!running) return;
    t.current = window.setInterval(tick, 2200);
    return () => {
      if (t.current) window.clearInterval(t.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, mode]);

  const reset = () => {
    setRows(liveTransactions);
    counter.current = 20300;
  };

  const metrics = useMemo(() => {
    const m: Record<Decision, number> = {
      allowed: 0,
      otp_required: 0,
      held_for_review: 0,
      blocked: 0,
      reversed: 0,
      sent_to_compliance: 0,
    };
    rows.forEach((r) => (m[r.decision] += 1));
    return {
      total: rows.length,
      ...m,
      highRisk: rows.filter((r) => r.risk === "high" || r.risk === "critical").length,
    };
  }, [rows]);

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Live Transactions</h1>
          <p className="text-sm text-muted-foreground">What decision was made on this transaction and why.</p>
        </div>
        <div className="flex items-center gap-3">
          <LiveDot label={running ? "Streaming" : "Paused"} />
          <div className="flex items-center gap-1 rounded-md border border-border bg-card p-1">
            <Button size="sm" variant={running ? "secondary" : "default"} onClick={() => setRunning(true)} className="h-7 px-2 text-xs">
              <Play className="h-3 w-3" /> Start
            </Button>
            <Button size="sm" variant={!running ? "secondary" : "ghost"} onClick={() => setRunning(false)} className="h-7 px-2 text-xs">
              <Pause className="h-3 w-3" /> Pause
            </Button>
            <Button size="sm" variant="ghost" onClick={tick} className="h-7 px-2 text-xs">
              <StepForward className="h-3 w-3" /> Process One
            </Button>
            <Button size="sm" variant="ghost" onClick={reset} className="h-7 px-2 text-xs">
              <RotateCcw className="h-3 w-3" /> Reset
            </Button>
          </div>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as StreamMode)}
            className="h-8 rounded-md border border-border bg-card px-2 text-xs"
          >
            {Object.entries(modeLabel).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        <KPIStatCard label="Processed" value={metrics.total} tone="info" />
        <KPIStatCard label="Allowed" value={metrics.allowed} tone="ok" />
        <KPIStatCard label="Sent for Verification" value={metrics.otp_required} tone="info" meaning="OTP / MFA requested" />
        <KPIStatCard label="Held for Review" value={metrics.held_for_review} tone="warn" />
        <KPIStatCard label="Blocked" value={metrics.blocked} tone="critical" />
        <KPIStatCard label="Reversed" value={metrics.reversed} tone="danger" />
        <KPIStatCard label="Avg Decision Time" value="142ms" tone="muted" />
        <KPIStatCard label="High-Risk Detected" value={metrics.highRisk} tone="danger" actionHint="Auto-routed to alerts" />
      </section>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[110px_1fr_110px_90px_140px_130px_90px_1fr_140px_110px] gap-2 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
          <div>Transaction</div>
          <div>Customer</div>
          <div className="text-right">Amount</div>
          <div>Channel</div>
          <div>Counterparty</div>
          <div>Decision</div>
          <div>Risk</div>
          <div>Main reason &amp; evidence</div>
          <div>Action</div>
          <div className="text-right">Time</div>
        </div>
        <div className="max-h-[640px] overflow-y-auto divide-y divide-border">
          {rows.map((r, i) => (
            <button
              key={r.id + i}
              onClick={() => setSelected(r)}
              className="grid w-full grid-cols-[110px_1fr_110px_90px_140px_130px_90px_1fr_140px_110px] gap-2 px-3 py-2.5 text-left text-sm hover:bg-accent/40 transition-colors"
            >
              <div className="font-mono text-xs">{r.id}</div>
              <div className="truncate">
                <div className="font-medium truncate">{r.customer}</div>
                <div className="text-[10px] text-muted-foreground font-mono">{r.customerId}</div>
              </div>
              <div className="text-right tabular-nums font-semibold">{fmtINR(r.amount)}</div>
              <div><Pill tone="muted" className="!normal-case">{r.channel}</Pill></div>
              <div className="truncate text-xs">{r.counterparty}</div>
              <div><DecisionStatusBadge decision={r.decision} /></div>
              <div><RiskBadge level={r.risk} /></div>
              <div className="min-w-0">
                <div className="text-xs truncate">{r.mainReason}</div>
                <div className="mt-0.5"><EvidenceStack items={r.evidence} max={4} /></div>
              </div>
              <div><RecommendedActionBadge action={r.recommendedAction} /></div>
              <div className="text-right text-[10px] text-muted-foreground tabular-nums">
                {new Date(r.time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </div>
            </button>
          ))}
        </div>
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-base">
                  <span className="font-mono text-xs text-muted-foreground">{selected.id}</span>
                  <span>{selected.customer}</span>
                  <button
                    aria-label="Close"
                    onClick={() => setSelected(null)}
                    className="ml-auto text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-5 text-sm">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-md border border-border bg-background/40 p-2">
                    <div className="text-[10px] uppercase text-muted-foreground">Amount</div>
                    <div className="text-sm font-semibold">{fmtINR(selected.amount)}</div>
                  </div>
                  <div className="rounded-md border border-border bg-background/40 p-2">
                    <div className="text-[10px] uppercase text-muted-foreground">Channel</div>
                    <div className="text-sm font-semibold">{selected.channel}</div>
                  </div>
                  <div className="rounded-md border border-border bg-background/40 p-2">
                    <div className="text-[10px] uppercase text-muted-foreground">Decision</div>
                    <div className="text-sm font-semibold">{decisionLabel[selected.decision]}</div>
                  </div>
                </div>

                <section>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Customer normal pattern</div>
                  <div className="text-sm">{selected.customerBaseline}</div>
                </section>
                <section>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">What changed</div>
                  <div className="text-sm">{selected.whatChanged}</div>
                </section>
                <section>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Why this was flagged</div>
                  <div className="text-sm">{selected.mainReason}</div>
                </section>
                <section>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">What the system found</div>
                  <EvidenceStack items={selected.evidence} max={20} />
                </section>
                <section>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">What action is recommended</div>
                  <RecommendedActionBadge action={selected.recommendedAction} />
                </section>
                <section>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">What to verify</div>
                  <ul className="list-disc pl-5 space-y-0.5 text-sm">
                    <li>Confirm device binding with customer via app prompt</li>
                    <li>Step-up via OTP if customer is reachable</li>
                    <li>Cross-check beneficiary against past transfers</li>
                  </ul>
                </section>
                <details className="rounded-md border border-border bg-background/40 p-2">
                  <summary className="text-xs cursor-pointer text-muted-foreground">Technical details</summary>
                  <div className="mt-2 text-[11px] font-mono text-muted-foreground space-y-0.5">
                    <div>risk_score: {selected.riskScore}</div>
                    <div>customer_id: {selected.customerId}</div>
                    <div>channel: {selected.channel}</div>
                  </div>
                </details>
                <div className="flex gap-2 pt-2 sticky bottom-0 bg-background py-3 border-t border-border">
                  <Button size="sm" className="flex-1">Allow</Button>
                  <Button size="sm" variant="secondary" className="flex-1">Request OTP</Button>
                  <Button size="sm" variant="destructive" className="flex-1">Block</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}