import * as React from 'react';
import { cn } from '@/lib';

export function Canvas({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main
      className={cn(
        'flex flex-1 flex-col overflow-y-auto bg-future-surface-raised p-6',
        className
      )}
    >
      {children}
    </main>
  );
}

/**
 * Responsive grid:
 *   < 768px   → 1 column
 *   768–1023  → 2 columns
 *   >= 1024   → 4 columns
 */
export function Grid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4',
        className
      )}
    >
      {children}
    </div>
  );
}

export function GridItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}
