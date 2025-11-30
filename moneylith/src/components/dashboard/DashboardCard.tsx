import { ReactNode } from "react";

interface DashboardCardProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
}

export function DashboardCard({ title, actionLabel, onAction, children }: DashboardCardProps) {
  return (
    <article className="rounded-2xl border border-white/10 bg-[#040d19] shadow-lg shadow-black/30">
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {actionLabel && (
          <button
            type="button"
            onClick={onAction}
            className="text-xs font-semibold text-moneylith-accent hover:text-white transition"
          >
            {actionLabel}
          </button>
        )}
      </header>
      <div className="p-4 text-sm text-moneylith-muted">{children}</div>
    </article>
  );
}
