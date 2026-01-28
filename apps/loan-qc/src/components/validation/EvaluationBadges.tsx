"use client";

import { BotMessageSquare, UserRound } from 'lucide-react';
import type { AIEvaluationStatus, HumanEvaluationStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

interface EvaluationBadgesProps {
  aiStatus: AIEvaluationStatus;
  humanStatus: HumanEvaluationStatus;
}

export function EvaluationBadges({
  aiStatus,
  humanStatus,
}: EvaluationBadgesProps) {
  const aiBadgeText =
    {
      yes: 'Yes',
      no: 'No',
      inconclusive: 'Inconclusive',
      pending: 'Pending',
    }[aiStatus] || 'Pending';

  const aiBadgeVariant = {
    yes: 'default' as const,
    no: 'destructive' as const,
    inconclusive: 'warning' as const,
    pending: 'secondary' as const,
  }[aiStatus];

  const humanBadgeText =
    humanStatus === 'needs-review'
      ? 'Needs review'
      : humanStatus === 'yes'
        ? 'Yes'
        : humanStatus === 'no'
          ? 'No'
          : humanStatus === 'na'
            ? 'N/A'
            : '—';

  const humanBadgeVariant = {
    'yes': 'default' as const,
    'no': 'destructive' as const,
    'needs-review': 'review' as const,
    'na': 'secondary' as const,
  }[humanStatus || 'na'] || ('secondary' as const);

  return (
    <div className="flex gap-2 items-center">
      {/* AI Badge */}
      <Badge variant={aiBadgeVariant} className="rounded-[calc(var(--radius)-2px)]">
        <BotMessageSquare />
        {aiBadgeText}
      </Badge>

      {/* Human Badge */}
      <Badge variant={humanBadgeVariant} className="rounded-[calc(var(--radius)-2px)]">
        <UserRound />
        {humanBadgeText}
      </Badge>
    </div>
  );
}
