import { Info } from 'lucide-react';
import type { ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface InfoTooltipProps {
  content: ReactNode;
  'aria-label': string;
}

/**
 * Info icon with a tooltip, used next to labels. A real button so the tooltip is
 * keyboard-reachable; requires an ancestor TooltipProvider.
 */
export function InfoTooltip({ content, 'aria-label': ariaLabel }: InfoTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          data-slot="guardrail-info-tooltip"
          aria-label={ariaLabel}
          className="inline-flex items-center justify-center align-text-bottom ml-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Info className="size-3.5 text-muted-foreground" />
        </button>
      </TooltipTrigger>
      {/* max-w is a documented local override; TooltipContent ships no width clamp. */}
      <TooltipContent side="top" className="max-w-[300px]">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
