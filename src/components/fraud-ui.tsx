import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/fraud-data";
import { Pill } from "@/components/risk-ui";
import {
  type CaseType,
  type Decision,
  type RecommendedAction,
  type SLAStatus,
  caseTypeLabel,
  decisionLabel,
  actionLabel,
  slaStatus,
  slaLabel,
} from "@/lib/ops-data";
import { AlertCircle, Clock, ShieldAlert, ShieldCheck, CheckCircle2, Ban, Hand, UserCheck, Flag } from "lucide-react";
import type { ReactNode } from "react";

type Tone = "ok" | "warn" | "danger" | "critical" | "info" | "muted";

const riskTone: Record<RiskLevel, Tone> = {
  low: "ok",
  medium: "warn",
  high: "danger",
  critical: "critical",
};

/* ---------- EvidenceChip ---------- */

const evidenceTone = (label: string): Tone => {
  const l = label.toLowerCase();
  if (/(trusted|verified|confirmed genuine|in normal|verified merchant)/.test(l)) return "ok";
  if (/(possible false positive|first-seen|above normal|unusual time|city mismatch)/.test(l)) return "warn";
  if (/(failed|mismatch|suspicious|new device|spike|structuring|card testing|rapid)/.test(l)) return "danger";
  if (/(confirmed fraud|mule|stolen|freeze|many customers|chargeback cluster)/.test(l)) return "critical";
  return "muted";
};

export function EvidenceChip({ label }: { label: string }) {
  return (
    <Pill tone={evidenceTone(label)} className="!text-[10px] !tracking-normal !normal-case !px-1.5 !py-0.5">
      {label}
    </Pill>
  );
}

export function EvidenceStack({ items, max = 5 }: { items: string[]; max?: number }) {
  const shown = items.slice(0, max);
  const extra = items.length - shown.length;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {shown.map((e) => (
        <EvidenceChip key={e} label={e} />
      ))}
      {extra > 0 && (
        <span className="text-[10px] text-muted-foreground">+{extra} more</span>
      )}
    </div>
  );
}

/* ---------- RiskScoreBadge ---------- */

export function RiskScoreBadge({ score, level, reason }: { score: number; level: RiskLevel; reason?: string }) {
  const tone = riskTone[level];
  return (
    <div className="inline-flex items-center gap-2">
      <Pill tone={tone}>
        {score} · {level}
      </Pill>
      {reason && <span className="text-[11px] text-muted-foreground truncate max-w-[260px]">{reason}</span>}
    </div>
  );
}

/* ---------- KPIStatCard ---------- */

export function KPIStatCard({
  label,
  value,
  meaning,
  actionHint,
  trend,
  tone = "muted",
}: {
  label: string;
  value: ReactNode;
  meaning?: string;
  actionHint?: string;
  trend?: string;
  tone?: Tone;
}) {
  const accent: Record<Tone, string> = {
    ok: "before:bg-[var(--ok)]",
    warn: "before:bg-[var(--warn)]",
    danger: "before:bg-[var(--danger)]",
    critical: "before:bg-[var(--critical)]",
    info: "before:bg-[var(--info)]",
    muted: "before:bg-border",
  };
  return (
    <div
      className={cn(
        "relative rounded-md border border-border bg-card p-3 pl-4",
        "before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:rounded-full",
        accent[tone],
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        {trend && <div className="text-[10px] text-muted-foreground tabular-nums">{trend}</div>}
      </div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
      {meaning && <div className="mt-0.5 text-[11px] text-muted-foreground leading-snug">{meaning}</div>}
      {actionHint && (
        <div className="mt-1 text-[10px] uppercase tracking-wider text-[var(--info)]">{actionHint}</div>
      )}
    </div>
  );
}

/* ---------- SLAIndicator ---------- */

const slaTone: Record<SLAStatus, Tone> = { on_time: "ok", warning: "warn", breached: "critical" };

export function SLAIndicator({ minutesLeft, compact = false }: { minutesLeft: number; compact?: boolean }) {
  const s = slaStatus(minutesLeft);
  return (
    <Pill tone={slaTone[s]} className="!normal-case !tracking-normal">
      <Clock className="h-3 w-3" />
      {compact ? (s === "breached" ? "Breached" : `${Math.max(0, Math.round(minutesLeft))}m`) : slaLabel(minutesLeft)}
    </Pill>
  );
}

/* ---------- CaseTypeBadge ---------- */

const caseTypeTone: Record<CaseType, Tone> = {
  account_takeover: "critical",
  unauthorized_transaction: "critical",
  app_scam: "danger",
  merchant_fraud: "danger",
  aml_suspicious: "info",
  card_testing: "warn",
  customer_risk: "warn",
  false_positive_review: "muted",
};

export function CaseTypeBadge({ type }: { type: CaseType }) {
  return <Pill tone={caseTypeTone[type]}>{caseTypeLabel[type]}</Pill>;
}

/* ---------- DecisionStatusBadge ---------- */

const decisionTone: Record<Decision, Tone> = {
  allowed: "ok",
  otp_required: "info",
  held_for_review: "warn",
  blocked: "critical",
  reversed: "danger",
  sent_to_compliance: "info",
};

export function DecisionStatusBadge({ decision }: { decision: Decision }) {
  return <Pill tone={decisionTone[decision]}>{decisionLabel[decision]}</Pill>;
}

/* ---------- RecommendedActionBadge ---------- */

const actionTone: Record<RecommendedAction, Tone> = {
  allow: "ok",
  verify_customer: "info",
  hold_transaction: "warn",
  block_transaction: "danger",
  freeze_account: "critical",
  escalate_compliance: "critical",
  review_thresholds: "info",
};

const actionIcon: Record<RecommendedAction, typeof CheckCircle2> = {
  allow: CheckCircle2,
  verify_customer: UserCheck,
  hold_transaction: Hand,
  block_transaction: Ban,
  freeze_account: ShieldAlert,
  escalate_compliance: Flag,
  review_thresholds: ShieldCheck,
};

export function RecommendedActionBadge({ action }: { action: RecommendedAction }) {
  const Icon = actionIcon[action];
  return (
    <Pill tone={actionTone[action]} className="!normal-case !tracking-normal">
      <Icon className="h-3 w-3" />
      {actionLabel[action]}
    </Pill>
  );
}

/* ---------- ActionRequiredCard ---------- */

export function ActionRequiredCard({
  tone = "warn",
  title,
  headline,
  stats,
  topEvidence,
  action,
  footer,
}: {
  tone?: Tone;
  title: string;
  headline: string;
  stats: { label: string; value: ReactNode }[];
  topEvidence?: string[];
  action: string;
  footer?: ReactNode;
}) {
  const accent: Record<Tone, string> = {
    ok: "border-l-[var(--ok)]",
    warn: "border-l-[var(--warn)]",
    danger: "border-l-[var(--danger)]",
    critical: "border-l-[var(--critical)]",
    info: "border-l-[var(--info)]",
    muted: "border-l-border",
  };
  return (
    <div className={cn("rounded-lg border border-border border-l-4 bg-card p-4 flex flex-col gap-3", accent[tone])}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> {title}
        </div>
        <Pill tone={tone}>{action}</Pill>
      </div>
      <div className="text-sm font-medium leading-snug">{headline}</div>
      <div className="grid grid-cols-2 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-md border border-border bg-background/40 px-2 py-1.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
            <div className="text-sm tabular-nums font-semibold">{s.value}</div>
          </div>
        ))}
      </div>
      {topEvidence && topEvidence.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Top evidence</div>
          <EvidenceStack items={topEvidence} />
        </div>
      )}
      {footer}
    </div>
  );
}

/* ---------- ChartCard ---------- */

export function ChartCard({ title, subtitle, children, right }: { title: string; subtitle?: string; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          {subtitle && <div className="text-[11px] text-muted-foreground">{subtitle}</div>}
        </div>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/* ---------- HBar (simple horizontal bar list) ---------- */

export function HBarList({ items, valueFmt }: { items: { label: string; value: number; tone?: Tone }[]; valueFmt?: (n: number) => string }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  const toneVar: Record<Tone, string> = {
    ok: "var(--ok)",
    warn: "var(--warn)",
    danger: "var(--danger)",
    critical: "var(--critical)",
    info: "var(--info)",
    muted: "var(--muted-foreground)",
  };
  return (
    <div className="space-y-2">
      {items.map((i) => (
        <div key={i.label} className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">{i.label}</span>
            <span className="tabular-nums font-medium">{valueFmt ? valueFmt(i.value) : i.value}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${(i.value / max) * 100}%`, background: toneVar[i.tone ?? "info"] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Funnel ---------- */

export function Funnel({ stages }: { stages: { label: string; value: number; tone?: Tone }[] }) {
  const max = Math.max(...stages.map((s) => s.value), 1);
  const toneVar: Record<Tone, string> = {
    ok: "var(--ok)",
    warn: "var(--warn)",
    danger: "var(--danger)",
    critical: "var(--critical)",
    info: "var(--info)",
    muted: "var(--muted-foreground)",
  };
  return (
    <div className="space-y-1.5">
      {stages.map((s, i) => {
        const w = (s.value / max) * 100;
        return (
          <div key={s.label} className="flex items-center gap-2">
            <div className="w-32 shrink-0 text-[11px] text-muted-foreground truncate">{s.label}</div>
            <div className="flex-1 h-6 rounded-md bg-muted overflow-hidden relative">
              <div
                className="h-full"
                style={{ width: `${w}%`, background: toneVar[s.tone ?? "info"] }}
              />
              <div className="absolute inset-0 flex items-center justify-end pr-2 text-[11px] tabular-nums font-medium">
                {s.value.toLocaleString()}
              </div>
            </div>
            {i < stages.length - 1 && (
              <div className="w-10 shrink-0 text-right text-[10px] text-muted-foreground tabular-nums">
                {Math.round((stages[i + 1].value / s.value) * 100)}%
              </div>
            )}
            {i === stages.length - 1 && <div className="w-10" />}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- LiveDot ---------- */

export function LiveDot({ label = "Live" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <span className="relative inline-flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--ok)] opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--ok)]" />
      </span>
      {label}
    </span>
  );
}

export { Pill };