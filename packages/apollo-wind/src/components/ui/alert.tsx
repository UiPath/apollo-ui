import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib';

const alertVariants = cva(
  'relative w-full rounded-xl border p-3 text-foreground [&>svg~*]:pl-6 [&>svg]:absolute [&>svg]:left-3 [&>svg]:top-3.5 [&>svg]:size-3.5',
  {
    variants: {
      variant: {
        default: 'border-border-subtle bg-surface [&>svg]:text-foreground-muted',
        info: 'border-info/30 bg-info-background/10 [&>svg]:text-info',
        success: 'border-success/50 bg-success-background/25 [&>svg]:text-success',
        warning: 'border-warning/50 bg-warning-background/25 [&>svg]:text-warning',
        destructive: 'border-error/50 bg-error-background/25 [&>svg]:text-error',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="alert"
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      data-slot="alert-title"
      className={cn('text-xs font-semibold leading-4', className)}
      {...props}
    />
  )
);
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="alert-description"
      className={cn(
        'mt-1 text-xs leading-4 text-foreground-muted [&_p+p]:mt-1 [&_p]:leading-4',
        className
      )}
      {...props}
    />
  )
);
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
