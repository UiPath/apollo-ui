import { TrendingDown, TrendingUp } from 'lucide-react';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/index';

export interface StatsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label?: string;
    direction?: 'up' | 'down';
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

const StatsCard = React.forwardRef<HTMLDivElement, StatsCardProps>(
  ({ title, value, description, icon, trend, variant = 'default', className, ...props }, ref) => {
    const variantStyles = {
      default: '',
      primary: 'border-primary/20 bg-primary/5',
      success: 'border-green-500/20 bg-green-500/5',
      warning: 'border-yellow-500/20 bg-yellow-500/5',
      danger: 'border-red-500/20 bg-red-500/5',
    };

    const trendDirection = trend?.direction || (trend && trend.value >= 0 ? 'up' : 'down');
    const TrendIcon = trendDirection === 'up' ? TrendingUp : TrendingDown;
    const trendColorClass =
      trendDirection === 'up'
        ? 'text-green-600 dark:text-green-400'
        : 'text-red-600 dark:text-red-400';

    return (
      <Card ref={ref} className={cn(variantStyles[variant], className)} {...props}>
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

export { StatsCard };
