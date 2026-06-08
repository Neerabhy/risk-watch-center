import { useMemo } from "react";
import type { AmlCluster } from "@/lib/fraud-data";
import { fmtINR } from "@/lib/fraud-data";

/**
 * Lays out source(s) on the left, beneficiary(ies) in the middle, receivers on the right.
 * Edges drawn with thickness proportional to amount.
 */
export function TransferGraph({ cluster }: { cluster: AmlCluster }) {
  const W = 880;
  const H = 460;
  const padX = 60;

  const layout = useMemo(() => {
    const sources = cluster.nodes.filter((n) => n.type === "source");
    const beneficiaries = cluster.nodes.filter((n) => n.type === "beneficiary");
    const receivers = cluster.nodes.filter((n) => n.type === "receiver");
    const cols = [sources, beneficiaries, receivers];
    const xs = [padX, W / 2, W - padX];
    const positions: Record<string, { x: number; y: number; type: string; label: string; sublabel?: string }> = {};
    cols.forEach((col, i) => {
      const step = (H - 80) / Math.max(col.length, 1);
      col.forEach((n, j) => {
        positions[n.id] = {
          x: xs[i],
          y: 40 + step * j + step / 2,
          type: n.type,
          label: n.label,
          sublabel: n.sublabel,
        };
      });
    });
    return positions;
  }, [cluster]);

  const maxAmt = Math.max(...cluster.edges.map((e) => e.amount));
  const strokeFor = (amt: number) => 1 + (amt / maxAmt) * 5;

  const colorFor = (type: string) => {
    if (type === "source") return "var(--info)";
    if (type === "beneficiary") return "var(--warn)";
    return "var(--danger)";
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div>
          <div className="text-sm font-semibold">{cluster.patternLabel}</div>
          <div className="text-xs text-muted-foreground">{cluster.patternSummary}</div>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--info)" }} /> Source</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--warn)" }} /> Beneficiary</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--danger)" }} /> Receiver</span>
        </div>
      </div>
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[460px] block">
          <defs>
            <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--muted-foreground)" />
            </marker>
            <marker id="arr-danger" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--danger)" />
            </marker>
          </defs>

          {/* edges */}
          {cluster.edges.map((e) => {
            const a = layout[e.from];
            const b = layout[e.to];
            if (!a || !b) return null;
            const mx = (a.x + b.x) / 2;
            const d = `M ${a.x + 12} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x - 12} ${b.y}`;
            const stroke = e.flagged ? "var(--danger)" : "var(--muted-foreground)";
            return (
              <g key={e.id} opacity={0.9}>
                <path
                  d={d}
                  stroke={stroke}
                  strokeWidth={strokeFor(e.amount)}
                  fill="none"
                  strokeOpacity={0.55}
                  markerEnd={e.flagged ? "url(#arr-danger)" : "url(#arr)"}
                />
                <text
                  x={mx}
                  y={(a.y + b.y) / 2 - 4}
                  textAnchor="middle"
                  className="fill-foreground"
                  fontSize="10"
                >
                  {fmtINR(e.amount)} · {e.channel}
                </text>
                <text
                  x={mx}
                  y={(a.y + b.y) / 2 + 10}
                  textAnchor="middle"
                  className="fill-muted-foreground"
                  fontSize="9"
                >
                  {e.txnId} · {e.time}
                </text>
              </g>
            );
          })}

          {/* nodes */}
          {Object.entries(layout).map(([id, p]) => {
            const color = colorFor(p.type);
            const w = 132;
            const h = 44;
            return (
              <g key={id} transform={`translate(${p.x - w / 2}, ${p.y - h / 2})`}>
                <rect
                  width={w}
                  height={h}
                  rx={8}
                  fill="var(--card)"
                  stroke={color}
                  strokeWidth={1.5}
                />
                <rect width="3" height={h} rx={1.5} fill={color} />
                <text x="12" y="18" fontSize="11" className="fill-foreground" fontWeight="600">{p.label}</text>
                <text x="12" y="32" fontSize="10" className="fill-muted-foreground">{p.sublabel ?? p.type}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="flex flex-wrap gap-1.5 border-t border-border px-4 py-3 bg-background/40">
        {cluster.signals.map((s) => (
          <span
            key={s.label}
            title={s.detail}
            className="rounded-md border border-border bg-card px-2 py-1 text-[11px]"
          >
            <span className="font-medium">{s.label}</span>{" "}
            <span className="text-muted-foreground">— {s.detail}</span>
          </span>
        ))}
      </div>
    </div>
  );
}