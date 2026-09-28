import { cn } from '@/lib/index';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('animate-pulse rounded-md bg-surface-overlay', className)}
      {...props}
    />
  );
}

export { Skeleton };
