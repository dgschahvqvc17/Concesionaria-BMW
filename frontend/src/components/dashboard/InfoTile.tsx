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
    <Card className={cn('border-border/70 shadow-sm transition-shadow hover:shadow-md', className)}>
      <CardContent className="flex items-center gap-4 p-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
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
