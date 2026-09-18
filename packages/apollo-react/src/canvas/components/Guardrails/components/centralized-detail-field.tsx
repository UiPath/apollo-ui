import { cn } from '@uipath/apollo-wind';
import type * as React from 'react';

export interface CentralizedDetailFieldProps {
  label: string;
  /** Extra classes for the group wrapper. */
  className?: string;
  children: React.ReactNode;
}

/** One labelled field of a read-only centralized guardrail, as a `<dl>` group. */
export function CentralizedDetailField({
  label,
  className,
  children,
}: CentralizedDetailFieldProps) {
  return (
    <div className={cn('space-y-0.5', className)}>
      <dt className="text-xs font-medium text-foreground">{label}</dt>
      <dd className="text-sm text-muted-foreground">{children}</dd>
    </div>
  );
}
