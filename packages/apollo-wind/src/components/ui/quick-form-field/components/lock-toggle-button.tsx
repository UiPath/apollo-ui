import { LockKeyhole, LockKeyholeOpen } from 'lucide-react';
import { InputGroupButton } from '@/components/ui/input-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { QuickFormFieldStrings } from '../types';

/**
 * The lock/unlock toggle shared by both the InputGroup and plain-Input
 * layouts. Disabled (and its label adjusted) when onLockedChange isn't
 * provided, since clicking it wouldn't do anything otherwise.
 */
export function LockToggleButton({
  locked,
  onLockedChange,
  strings,
}: {
  locked: boolean;
  onLockedChange?: (locked: boolean) => void;
  /** See QuickFormFieldStrings. */
  strings: QuickFormFieldStrings;
}) {
  const interactive = !!onLockedChange;
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <InputGroupButton
            icon
            size="3xs"
            disabled={!interactive}
            onClick={() => onLockedChange?.(!locked)}
            aria-label={
              interactive
                ? locked
                  ? strings.lockedHint
                  : strings.unlockedHint
                : locked
                  ? strings.lockedLabel
                  : strings.unlockedLabel
            }
          >
            {locked ? <LockKeyhole size={16} /> : <LockKeyholeOpen size={16} />}
          </InputGroupButton>
        </TooltipTrigger>
        <TooltipContent>{locked ? strings.lockedLabel : strings.unlockedLabel}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
