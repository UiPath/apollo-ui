import { cva, type VariantProps } from 'class-variance-authority';
import { TrendingDown, TrendingUp } from 'lucide-react';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/index';

const statsCardVariants = cva('', {
  variants: {
    variant: {
      default: '',
      primary: 'border-primary/20 bg-primary/5',
      success: 'border-success/20 bg-success/5',
      warning: 'border-warning/20 bg-warning/5',
      danger: 'border-error/20 bg-error/5',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface StatsCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statsCardVariants> {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label?: string;
    direction?: 'up' | 'down';
  };
}

const StatsCard = React.forwardRef<HTMLDivElement, StatsCardProps>(
  ({ title, value, description, icon, trend, variant, className, ...props }, ref) => {
    const trendDirection = trend?.direction || (trend && trend.value >= 0 ? 'up' : 'down');
    const TrendIcon = trendDirection === 'up' ? TrendingUp : TrendingDown;
    const trendColorClass = trendDirection === 'up' ? 'text-success' : 'text-error';

    return (
      <Card
        ref={ref}
        data-slot="stats-card"
        className={cn(statsCardVariants({ variant }), className)}
        {...props}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {(description || trend) && (
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              {trend && (
                <span className={cn('flex items-center gap-1 font-medium', trendColorClass)}>
                  <TrendIcon className="h-3 w-3" />
                  {Math.abs(trend.value)}%
                </span>
              )}
              {description && <span>{description}</span>}
              {trend?.label && <span>{trend.label}</span>}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);
StatsCard.displayName = 'StatsCard';

export { StatsCard, statsCardVariants };
