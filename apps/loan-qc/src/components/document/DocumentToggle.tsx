"use client";

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { Document } from '@/lib/types';

interface DocumentToggleProps {
  documents: Document[];
  activeDocumentId: string;
  onDocumentChange: (documentId: string) => void;
}

export function DocumentToggle({
  documents,
  activeDocumentId,
  onDocumentChange,
}: DocumentToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={activeDocumentId}
      onValueChange={(value) => {
        if (value) onDocumentChange(value);
      }}
      variant="outline"
      spacing={0}
      className="shadow-[0px_1px_2px_0px_var(--shadow-xs)]"
    >
      {documents.map((doc) => (
        <ToggleGroupItem
          key={doc.id}
          value={doc.id}
          className="px-4 py-2.5 text-sm font-medium leading-5 bg-background data-[state=on]:bg-[#1E293B] data-[state=on]:text-white data-[state=on]:hover:bg-[#1E293B] data-[state=on]:hover:text-white"
        >
          {doc.name}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
