"use client";

import { ValidationItem } from './ValidationItem';
import { Separator } from '@/components/ui/separator';
import type { ValidationItem as ValidationItemType, HumanEvaluationStatus } from '@/lib/types';

interface ValidationChecklistProps {
  items: ValidationItemType[];
  onUpdateEvaluation: (itemId: string, status: HumanEvaluationStatus) => void;
  onAddComment: (itemId: string, text: string) => void;
  expandedItemId?: string | null;
  onItemClick?: (itemId: string) => void;
}

export function ValidationChecklist({
  items,
  onUpdateEvaluation,
  onAddComment,
  expandedItemId,
  onItemClick,
}: ValidationChecklistProps) {
  return (
    <div className="flex flex-col gap-1 w-full pl-8 pt-8">
      {items.map((item, index) => (
        <div key={item.id}>
          {/* Separator for non-first items */}
          {index > 0 && <Separator className="mb-4" />}

          <ValidationItem
            item={item}
            onHumanEvaluation={(status) => onUpdateEvaluation(item.id, status)}
            onAddComment={(text) => onAddComment(item.id, text)}
            isExpanded={item.id === expandedItemId}
            onClick={() => onItemClick?.(item.id)}
          />
        </div>
      ))}
    </div>
  );
}
