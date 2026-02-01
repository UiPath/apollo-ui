"use client";

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarFooterProps {
  title: string;
  currentIndex: number;
  totalCount: number;
  onPrevious?: () => void;
  onNext?: () => void;
}

export function SidebarFooter({
  title,
  currentIndex,
  totalCount,
  onPrevious,
  onNext,
}: SidebarFooterProps) {
  return (
    <div className="bg-secondary border-t border-border flex items-center justify-between pl-[46px] pr-6 py-[13px]">
      <p className="text-sm text-secondary-foreground">
        <span className="font-semibold">{title}</span>
        <span>{` ${currentIndex} of ${totalCount}`}</span>
      </p>
      <div className="flex gap-0 items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onPrevious}
          disabled={currentIndex <= 1}
          className="size-9 rounded-[calc(var(--radius)-2px)]"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNext}
          disabled={currentIndex >= totalCount}
          className="size-9 rounded-[calc(var(--radius)-2px)]"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
