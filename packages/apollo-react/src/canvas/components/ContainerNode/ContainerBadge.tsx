import type { ReactNode } from 'react';

/** Neutral pill shown next to a container title. */
export function ContainerBadge({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <span className="flex h-6 shrink-0 items-center gap-1 rounded-full border border-border bg-surface px-2.5 text-[11px] font-semibold leading-4 text-foreground shadow-sm">
      {icon}
      {children}
    </span>
  );
}
