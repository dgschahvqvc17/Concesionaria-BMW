import { cn } from '@/lib/utils';

interface MStripeProps {
  className?: string;
}

/** Franja tricolor del emblema "M" de BMW (azul claro, azul oscuro, rojo). */
export function MStripe({ className }: MStripeProps) {
  return (
    <span
      aria-hidden="true"
      className={cn('inline-flex h-5 w-9 -skew-x-12 overflow-hidden rounded-sm', className)}
    >
      <span className="h-full flex-1 bg-m-blue" />
      <span className="h-full flex-1 bg-m-darkblue" />
      <span className="h-full flex-1 bg-m-red" />
    </span>
  );
}
