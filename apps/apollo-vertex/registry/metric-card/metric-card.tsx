import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, type CardProps } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricCardProps extends React.ComponentProps<"div"> {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  percentage?: number;
  isLowerBetter?: boolean;
  variant?: CardProps["variant"];
}

function MetricCard({
  label,
  value,
  trend,
  percentage,
  isLowerBetter = false,
  variant = "default",
  className,
  ...props
}: MetricCardProps) {
  const showTrend =
    trend != null &&
    trend !== "neutral" &&
    percentage != null &&
    percentage !== 0;
  const isPositiveTrend = isLowerBetter ? trend === "down" : trend === "up";
  const sign = trend === "up" ? "+" : "-";
  const badgeStatus = isPositiveTrend ? "success" : "error";

  return (
    <Card
      data-slot="metric-card"
      variant={variant}
      className={className}
      {...props}
    >
      <div data-slot="metric-card-content" className="flex flex-col gap-1 p-6">
        <p
          data-slot="metric-card-label"
          className="text-xs font-semibold leading-tight text-muted-foreground line-clamp-2"
        >
          {label}
        </p>
        <div
          data-slot="metric-card-value"
          className="flex items-center gap-x-3 gap-y-0.5 flex-wrap"
        >
          <p className="text-2xl md:text-3xl font-bold leading-tight tracking-tight text-foreground">
            {value}
          </p>
          {showTrend && (
            <Badge variant="secondary" status={badgeStatus}>
              {`${sign}${Math.abs(percentage)}%`}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}

interface MetricCardSkeletonProps extends React.ComponentProps<"div"> {
  variant?: CardProps["variant"];
}

function MetricCardSkeleton({
  variant = "default",
  className,
  ...props
}: MetricCardSkeletonProps) {
  return (
    <Card
      data-slot="metric-card"
      variant={variant}
      className={className}
      {...props}
    >
      <div data-slot="metric-card-content" className="flex flex-col gap-1 p-6">
        <Skeleton className="h-4 w-28" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-14" />
        </div>
      </div>
    </Card>
  );
}

export { MetricCard, MetricCardSkeleton };
export type { MetricCardProps, MetricCardSkeletonProps };
