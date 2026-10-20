import { cn } from '@uipath/apollo-wind';
import type React from 'react';

/**
 * Marks a region of the Wind chat that has not been built yet, so a gap is visible rather than
 * silently empty. Not localized: it is a development placeholder, not product copy.
 */
export function PlaceholderRegion({
  name,
  slot,
  className,
  children,
}: {
  name: string;
  /** The `data-slot` the real region will keep, so tests and hosts do not depend on this stand-in. */
  slot: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-label={name}
      data-slot={slot}
      data-placeholder=""
      className={cn(
        'flex items-center justify-center rounded-lg border border-dashed border-border-de-emp p-4 text-center text-sm text-muted-foreground',
        className
      )}
    >
      {children}
    </section>
  );
}
