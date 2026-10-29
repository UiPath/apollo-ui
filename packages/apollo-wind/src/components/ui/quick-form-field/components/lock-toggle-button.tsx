import { LockKeyhole, LockKeyholeOpen } from 'lucide-react';
import { FIELD_ADDON_BUTTON_CLASS } from '@/components/ui/field-addons/field-addon-button';
import { InputGroupButton } from '@/components/ui/input-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { QuickFormFieldStrings } from '../types';

/**
 * The lock/unlock toggle in the field's leading addon. Disabled (and its label
 * adjusted) with the field, or when onLockedChange isn't provided, since
 * clicking it wouldn't do anything otherwise.
 */
export function LockToggleButton({
  locked,
  onLockedChange,
  disabled,
  strings,
}: {
  locked: boolean;
  onLockedChange?: (locked: boolean) => void;
  disabled?: boolean;
  /** See QuickFormFieldStrings. */
  strings: QuickFormFieldStrings;
}) {
  const interactive = !!onLockedChange && !disabled;
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <InputGroupButton
            size="3xs"
            className={FIELD_ADDON_BUTTON_CLASS}
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
