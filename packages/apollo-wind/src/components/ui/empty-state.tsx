import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/index';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional visual element displayed above the content (icon, illustration, video, etc.) */
  icon?: React.ReactNode;
  /** Optional large status code displayed above the title (e.g. "404", "500") */
  code?: string;
  /** Primary heading — always visible */
  title: string;
  /** Optional body text below the title */
  description?: string;
  /** Simple primary action — ignored when children are provided */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Simple secondary action — ignored when children are provided */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ icon, code, title, description, action, secondaryAction, className, children, ...props }, ref) => {
    const hasSimpleActions = !children && (action || secondaryAction);

    return (
      <div
        ref={ref}
        className={cn('flex flex-col items-center justify-center p-8 text-center', className)}
        {...props}
      >
        {icon && (
          <div className="mb-6 flex items-center justify-center">
            {icon}
          </div>
        )}
        {code && (
          <h1 className="text-[40px] font-bold tracking-[-0.8px] leading-none mb-4">{code}</h1>
        )}
        <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
        {description && (
          <p className="mt-3 max-w-md text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
        {hasSimpleActions && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {action && <Button onClick={action.onClick}>{action.label}</Button>}
            {secondaryAction && (
              <Button variant="outline" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
        {children && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {children}
          </div>
        )}
      </div>
    );
  }
);
EmptyState.displayName = 'EmptyState';

export { EmptyState };
