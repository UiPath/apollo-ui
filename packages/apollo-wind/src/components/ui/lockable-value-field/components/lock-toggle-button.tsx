import { LockKeyhole, LockKeyholeOpen } from 'lucide-react';
import { InputGroupButton } from '@/components/ui/input-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * The lock/unlock toggle shared by both the InputGroup and plain-Input
 * layouts. Disabled (and its label adjusted) when onLockedChange isn't
 * provided, since clicking it wouldn't do anything otherwise.
 */
export function LockToggleButton({
  locked,
  onLockedChange,
}: {
  locked: boolean;
  onLockedChange?: (locked: boolean) => void;
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
                  ? 'Read-only. Click to make editable.'
                  : 'Editable. Click to make read-only.'
                : locked
                  ? 'Read-only'
                  : 'Editable'
            }
          >
            {locked ? <LockKeyhole size={16} /> : <LockKeyholeOpen size={16} />}
          </InputGroupButton>
        </TooltipTrigger>
        <TooltipContent>{locked ? 'Read-only' : 'Editable'}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
