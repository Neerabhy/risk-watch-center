import { Link, useRouterState } from "@tanstack/react-router";
import { Shield, Activity, GitBranch, AlertTriangle, Search, Radio, Bell, Gavel, Store } from "lucide-react";
import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";

const nav = [
  { to: "/", label: "Dashboard", icon: Activity, exact: true },
  { to: "/live", label: "Live Transactions", icon: Radio },
  { to: "/alerts", label: "Fraud Alerts", icon: Bell },
  { to: "/review", label: "Human Review", icon: Gavel },
  { to: "/merchants", label: "Merchant Risk", icon: Store },
  { to: "/monitored", label: "Monitored accounts", icon: Shield },
  { to: "/aml", label: "AML monitoring", icon: GitBranch },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Sentinel Ops</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Fraud &amp; AML</div>
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {nav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60"
                }`}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3 text-[11px] text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Analyst</span>
            <span className="font-mono">priya.k</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span>Shift</span>
            <span>SOC-IN · Day</span>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search customer, account, or transaction ID"
              className="h-9 pl-8 bg-card border-border"
            />
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex h-2 w-2 rounded-full bg-[var(--ok)]" />
            Live · 12 active queues
          </div>
        </header>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}