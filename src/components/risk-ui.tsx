import type { RiskLevel, MonitoringStatus, Recommendation, AccountStatus } from "@/lib/fraud-data";
import { cn } from "@/lib/utils";

type Tone = "ok" | "warn" | "danger" | "critical" | "info" | "muted";

const toneClass: Record<Tone, string> = {
  ok: "bg-[color-mix(in_oklab,var(--ok)_18%,transparent)] text-[var(--ok)] border-[color-mix(in_oklab,var(--ok)_35%,transparent)]",
  warn: "bg-[color-mix(in_oklab,var(--warn)_18%,transparent)] text-[var(--warn)] border-[color-mix(in_oklab,var(--warn)_35%,transparent)]",
  danger: "bg-[color-mix(in_oklab,var(--danger)_18%,transparent)] text-[var(--danger)] border-[color-mix(in_oklab,var(--danger)_40%,transparent)]",
  critical: "bg-[color-mix(in_oklab,var(--critical)_22%,transparent)] text-[var(--critical)] border-[color-mix(in_oklab,var(--critical)_50%,transparent)]",
  info: "bg-[color-mix(in_oklab,var(--info)_18%,transparent)] text-[var(--info)] border-[color-mix(in_oklab,var(--info)_35%,transparent)]",
  muted: "bg-muted text-muted-foreground border-border",
};

export function Pill({ tone = "muted", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const riskTone: Record<RiskLevel, Tone> = { low: "ok", medium: "warn", high: "danger", critical: "critical" };

export function RiskBadge({ level }: { level: RiskLevel }) {
  return <Pill tone={riskTone[level]}>{level}</Pill>;
}

const monStatusTone: Record<MonitoringStatus, Tone> = {
  monitoring: "ok",
  review_required: "warn",
  freeze_recommended: "danger",
  frozen: "critical",
  closed: "muted",
};

export function MonitoringStatusBadge({ status }: { status: MonitoringStatus }) {
  const label: Record<MonitoringStatus, string> = {
    monitoring: "Monitoring",
    review_required: "Review required",
    freeze_recommended: "Freeze recommended",
    frozen: "Frozen",
    closed: "Closed",
  };
  return <Pill tone={monStatusTone[status]}>{label[status]}</Pill>;
}

const accountTone: Record<AccountStatus, Tone> = { active: "ok", frozen: "critical", closed: "muted" };

export function AccountStatusBadge({ status }: { status: AccountStatus }) {
  return <Pill tone={accountTone[status]}>{status}</Pill>;
}

const recTone: Record<Recommendation, Tone> = {
  continue_monitoring: "info",
  hold_and_review: "warn",
  freeze_recommended: "danger",
  close_account: "critical",
};

export function RecommendationBadge({ rec }: { rec: Recommendation }) {
  const label: Record<Recommendation, string> = {
    continue_monitoring: "Continue monitoring",
    hold_and_review: "Hold & review",
    freeze_recommended: "Freeze",
    close_account: "Close account",
  };
  return <Pill tone={recTone[rec]}>{label[rec]}</Pill>;
}

export function Kpi({
  label,
  value,
  hint,
  tone = "muted",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
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
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function RiskGauge({ score }: { score: number }) {
  const tone: Tone = score >= 85 ? "critical" : score >= 70 ? "danger" : score >= 40 ? "warn" : "ok";
  const colorVar: Record<Tone, string> = {
    ok: "var(--ok)",
    warn: "var(--warn)",
    danger: "var(--danger)",
    critical: "var(--critical)",
    info: "var(--info)",
    muted: "var(--muted-foreground)",
  };
  const pct = Math.min(100, Math.max(0, score));
  const r = 32;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <div className="flex items-center gap-3">
      <svg width="84" height="84" viewBox="0 0 84 84" className="-rotate-90">
        <circle cx="42" cy="42" r={r} stroke="var(--border)" strokeWidth="8" fill="none" />
        <circle
          cx="42"
          cy="42"
          r={r}
          stroke={colorVar[tone]}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
        />
      </svg>
      <div>
        <div className="text-2xl font-semibold tabular-nums">{score}</div>
        <div className="text-xs text-muted-foreground">Risk score</div>
      </div>
    </div>
  );
}