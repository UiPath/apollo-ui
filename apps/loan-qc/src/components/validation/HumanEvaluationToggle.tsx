"use client";

import { MessageSquareText } from 'lucide-react';
import type { HumanEvaluationStatus } from '@/lib/types';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';

interface HumanEvaluationToggleProps {
  value: HumanEvaluationStatus;
  onChange: (value: HumanEvaluationStatus) => void;
  onCommentClick?: () => void;
}

export function HumanEvaluationToggle({
  value,
  onChange,
  onCommentClick,
}: HumanEvaluationToggleProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold leading-4 text-muted-foreground">
        Human evaluation
      </p>

      <div className="flex gap-2 items-center">
        {/* Toggle Group */}
        <ToggleGroup
          type="single"
          value={value || undefined}
          onValueChange={(newValue) => {
            if (newValue) onChange(newValue as HumanEvaluationStatus);
          }}
          variant="outline"
          spacing={0}
          className="shadow-[0px_1px_2px_0px_var(--shadow-xs)]"
        >
          <ToggleGroupItem value="yes" className="px-4 py-2.5 text-sm font-medium leading-5">
            Yes
          </ToggleGroupItem>
          <ToggleGroupItem value="no" className="px-4 py-2.5 text-sm font-medium leading-5">
            No
          </ToggleGroupItem>
          <ToggleGroupItem value="na" className="px-4 py-2.5 text-sm font-medium leading-5">
            N/A
          </ToggleGroupItem>
        </ToggleGroup>

        {/* Comment Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={onCommentClick}
          className="border-input"
        >
          <MessageSquareText className="size-4" />
        </Button>
      </div>
    </div>
  );
}
