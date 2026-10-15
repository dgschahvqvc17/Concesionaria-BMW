import type { ReactNode } from 'react';

import { MStripe } from '@/components/brand/MStripe';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

/** Encabezado de página con acento de marca y acciones opcionales. */
export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex animate-slide-up flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        {eyebrow && (
          <div className="flex items-center gap-2.5">
            <MStripe className="h-3.5 w-8" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
              {eyebrow}
            </span>
          </div>
        )}
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{title}</h1>
        {description && (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
