import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/index";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ icon, title, description, action, secondaryAction, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col items-center justify-center p-8 text-center", className)}
        {...props}
      >
        {icon && (
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
            {icon}
          </div>
        )}
        <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
        {description && (
          <p className="mt-3 mb-6 max-w-md text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
        {(action || secondaryAction) && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {action && <Button onClick={action.onClick}>{action.label}</Button>}
            {secondaryAction && (
              <Button variant="outline" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  },
);
EmptyState.displayName = "EmptyState";

export { EmptyState };
