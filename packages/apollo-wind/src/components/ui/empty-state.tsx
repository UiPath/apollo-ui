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
  /**
   * `compact` fits inside a panel or list: smaller type and spacing. It renders no heading element
   * (the title and any code are paragraphs): inside a panel the empty message is content of the
   * panel's own section, and a heading there would add a stray entry to the page outline.
   */
  size?: 'default' | 'compact';
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      icon,
      code,
      title,
      description,
      action,
      secondaryAction,
      size = 'default',
      className,
      children,
      ...props
    },
    ref
  ) => {
    const hasSimpleActions = !children && (action || secondaryAction);
    const compact = size === 'compact';
    const buttonSize = compact ? 'sm' : undefined;
    const actionsClassName = compact
      ? 'mt-4 flex flex-wrap items-center justify-center gap-2'
      : 'mt-6 flex flex-wrap items-center justify-center gap-2';

    return (
      <div
        ref={ref}
        data-slot="empty-state"
        data-size={compact ? 'compact' : undefined}
        className={cn(
          compact
            ? 'flex flex-col items-center justify-center px-4 py-8 text-center'
            : 'flex flex-col items-center justify-center p-8 text-center',
          className
        )}
        {...props}
      >
        {icon && (
          <div
            className={
              compact
                ? 'mb-3 flex items-center justify-center'
                : 'mb-6 flex items-center justify-center'
            }
          >
            {icon}
          </div>
        )}
        {code &&
          (compact ? (
            <p className="mb-2 text-2xl font-bold leading-none">{code}</p>
          ) : (
            <h1 className="text-[40px] font-bold tracking-[-0.8px] leading-none mb-4">{code}</h1>
          ))}
        {compact ? (
          <p className="text-sm text-foreground">{title}</p>
        ) : (
          <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
        )}
        {description && (
          <p
            className={
              compact
                ? 'mt-1 max-w-md text-xs text-muted-foreground'
                : 'mt-3 max-w-md text-sm text-muted-foreground leading-relaxed'
            }
          >
            {description}
          </p>
        )}
        {hasSimpleActions && (
          <div className={actionsClassName}>
            {action && (
              <Button size={buttonSize} onClick={action.onClick}>
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button size={buttonSize} variant="outline" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
        {children && <div className={actionsClassName}>{children}</div>}
      </div>
    );
  }
);
EmptyState.displayName = 'EmptyState';

export { EmptyState };
