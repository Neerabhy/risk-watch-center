import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { RiskBadge, RiskGauge } from "./risk-ui";
import type { RiskLevel } from "@/lib/fraud-data";
import { CheckCircle2, ArrowRight } from "lucide-react";

export interface InvestigationData {
  agentName: string;
  score: number;
  riskLevel: RiskLevel;
  recommendation: string;
  summary?: string;
  reasons: string[];
  evidenceTxnIds: string[];
  nextSteps: string[];
}

export function InvestigationPanel({
  open,
  onOpenChange,
  data,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  data: InvestigationData | null;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg bg-card border-l border-border overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-[color-mix(in_oklab,var(--info)_20%,transparent)] text-[var(--info)]">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            {data?.agentName ?? "Investigation"}
          </SheetTitle>
          <SheetDescription>Agent investigation output</SheetDescription>
        </SheetHeader>
        {data && (
          <div className="mt-4 space-y-5 px-1">
            <div className="flex items-center justify-between rounded-md border border-border bg-background/40 p-3">
              <RiskGauge score={data.score} />
              <div className="text-right">
                <RiskBadge level={data.riskLevel} />
                <div className="mt-2 text-xs text-muted-foreground">Recommendation</div>
                <div className="text-sm font-medium">{data.recommendation}</div>
              </div>
            </div>
            {data.summary && (
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Summary</div>
                <p className="text-sm leading-relaxed">{data.summary}</p>
              </div>
            )}
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Reasons</div>
              <ul className="space-y-1.5">
                {data.reasons.map((r) => (
                  <li key={r} className="flex gap-2 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--danger)]" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Evidence transactions</div>
              <div className="flex flex-wrap gap-1.5">
                {data.evidenceTxnIds.map((id) => (
                  <code key={id} className="rounded bg-muted px-2 py-0.5 text-[11px] font-mono">{id}</code>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Suggested next steps</div>
              <ol className="space-y-1.5">
                {data.nextSteps.map((s, i) => (
                  <li key={s} className="flex gap-2 text-sm">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-muted text-[10px] font-mono">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
            <div className="flex gap-2 pt-2">
              <Button className="flex-1">
                Apply recommendation <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}