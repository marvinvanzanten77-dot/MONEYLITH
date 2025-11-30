import { ReactNode } from "react";

interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function DashboardLayout({ title, subtitle, children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[#02060d] text-white">
      <header className="moneylith-header border-b border-white/10 bg-[#030a18]/80 px-6 py-5">
        <div className="mx-auto flex max-w-6xl flex-col gap-1">
          <p className="text-xs uppercase tracking-[0.4em] text-moneylith-muted">Moneylith</p>
          <h1 className="text-3xl font-semibold">{title}</h1>
          {subtitle && <p className="text-sm text-moneylith-muted">{subtitle}</p>}
          <p className="text-sm text-moneylith-muted">
            Kies een onderdeel van Moneylith om verder te werken.
          </p>
        </div>
      </header>
      <main className="px-6 py-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">{children}</div>
      </main>
    </div>
  );
}
