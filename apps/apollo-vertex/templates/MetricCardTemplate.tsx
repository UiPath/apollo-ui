"use client";

import { MetricCard, MetricCardSkeleton } from "@/components/ui/metric-card";

export function MetricCardTemplate() {
  return (
    <div className="p-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Summaries Generated"
          value={1_284}
          trend="up"
          percentage={12}
        />
        <MetricCard
          label="Review Time"
          value="4.2m"
          trend="down"
          percentage={8}
          isLowerBetter
        />
        <MetricCard label="Approved" value={942} trend="up" percentage={5} />
        <MetricCard
          label="Rejected"
          value={18}
          trend="down"
          percentage={20}
          isLowerBetter
        />
      </div>
    </div>
  );
}

export function MetricCardSkeletonTemplate() {
  return (
    <div className="p-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>
    </div>
  );
}
