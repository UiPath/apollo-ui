"use client";

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ObjectHeaderProps {
  onBack?: () => void;
}

export function ObjectHeader({ onBack }: ObjectHeaderProps) {
  return (
    <div className="flex items-center align-left gap-2 px-8 py-4 bg-background border-b border-border">
      <Button
        variant="secondary"
        size="icon"
        onClick={onBack}
        className="size-10"
      >
        <ArrowLeft className="size-6" />
      </Button>
      <div className="flex flex-col">
        <p className="text-xl font-bold text-foreground">Agreement to provide insurance</p>
        <p className="text-sm font-normal text-muted-foreground">CRE #00000000000-00</p>
      </div>
    </div>
  );
}
