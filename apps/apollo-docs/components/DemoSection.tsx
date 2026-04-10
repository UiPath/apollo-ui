'use client';

import type { ReactNode } from 'react';

interface DemoSectionProps {
  label: string;
  children: ReactNode;
}

export function DemoSection({ label, children }: DemoSectionProps) {
  return (
    <div className="mb-8">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        {label}
      </p>
      <div className="flex flex-wrap items-center gap-3 p-5 rounded-lg border border-border bg-card">
        {children}
      </div>
    </div>
  );
}
