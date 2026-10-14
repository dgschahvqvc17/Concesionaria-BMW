import { useId } from 'react';

import { cn } from '@/lib/utils';

interface BmwRoundelProps {
  className?: string;
  /** Texto accesible; por defecto "BMW". */
  title?: string;
}

/** Logotipo redondo (roundel) de BMW en SVG, escalable y accesible. */
export function BmwRoundel({ className, title = 'BMW' }: BmwRoundelProps) {
  const id = useId();
  const arcId = `${id}-arc`;
  const sheenId = `${id}-sheen`;

  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label={title}
      className={cn('h-10 w-10', className)}
    >
      <defs>
        <path id={arcId} d="M50 50 m-42 0 a42 42 0 0 1 84 0" />
        <radialGradient id={sheenId} cx="50%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="50" cy="50" r="50" fill="#0b0b0d" />
      <circle cx="50" cy="50" r="35" fill="#e9ebee" />
      <circle cx="50" cy="50" r="34" fill="#ffffff" />

      {/* Cuadrantes azul/blanco */}
      <path d="M50 50 V16 A34 34 0 0 0 16 50 Z" fill="#1c69d4" />
      <path d="M50 50 V84 A34 34 0 0 0 84 50 Z" fill="#1c69d4" />
      <circle cx="50" cy="50" r="34" fill="none" stroke="#0b0b0d" strokeWidth="1.5" />

      <text fontSize="12" fontWeight="700" fill="#ffffff" letterSpacing="0.5">
        <textPath href={`#${arcId}`} startOffset="50%" textAnchor="middle">
          BMW
        </textPath>
      </text>

      <circle cx="50" cy="50" r="50" fill={`url(#${sheenId})`} />
    </svg>
  );
}
