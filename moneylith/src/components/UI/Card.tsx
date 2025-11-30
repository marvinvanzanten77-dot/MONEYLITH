import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  meta?: ReactNode;
}

export function Card({ title, subtitle, icon, children, className = "", meta }: CardProps) {
  return (
    <section className={`moneylith-card ${className}`}>
      {(title || subtitle || meta || icon) && (
        <header className="card-header">
          <div>
            {title && <h2 className="card-title">{title}</h2>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {(meta || icon) && (
            <div className="card-meta">
              <div className="flex items-center gap-2">
                {meta && <span>{meta}</span>}
                {icon && <div className="text-xl text-moneylith-emerald">{icon}</div>}
              </div>
            </div>
          )}
        </header>
      )}
      <div className="card-body">{children}</div>
    </section>
  );
}
