import type * as React from 'react';

export interface EmptyRowsProps {
  /** Says what happens with no items, e.g. "No conditions. The rule always applies." */
  children: React.ReactNode;
}

/** Stands in for a repeatable list's items once the last one is removed. */
export function EmptyRows({ children }: EmptyRowsProps) {
  return <p className="py-2 text-center text-xs italic text-muted-foreground">{children}</p>;
}
