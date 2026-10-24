import type { LucideIcon } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface InfoTileProps {
  icon: LucideIcon;
  label: string;
  value: string;
  className?: string;
}

/** Tarjeta compacta que muestra un dato del perfil con su icono. */
export function InfoTile({ icon: Icon, label, value, className }: InfoTileProps) {
  return (
    <Card
      className={cn(
        'group border-border/60 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-blue/30',
        className
      )}
    >
      <CardContent className="flex items-center gap-4 p-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue/15 to-brand-blue-deep/10 text-brand-blue-deep ring-1 ring-brand-blue/10 transition-transform duration-300 group-hover:scale-105">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="truncate text-sm font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
