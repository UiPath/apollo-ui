import {
  Badge,
  DropdownMenuPortal,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@uipath/apollo-wind';
import { useResolvedPortalContainer } from '@uipath/apollo-wind/components/ui/portal-container';
import { Check } from 'lucide-react';
import type React from 'react';
import { useId } from 'react';
import {
  POLICY_CHECK_CLASS,
  POLICY_HINT_CLASS,
  POLICY_ITEM_CLASS,
  POLICY_OPTION_CLASS,
  POLICY_OPTION_CODE_CLASS,
  POLICY_OPTION_LABEL_CLASS,
  POLICY_OPTION_TITLE_CLASS,
  POLICY_SUBMENU_CLASS,
} from './sentenceStyles';

/** One choice of the picker; one with `options` opens them as a submenu. */
export interface PolicyOption {
  /** What `onChange` receives; a submenu's own value is only its key. */
  value: string;
  /** The short form the trigger shows before the label, e.g. "U"; a submenu has none. */
  code?: string;
  label: string;
  /** Shown under the label, and its description. */
  hint?: string;
  /** Why the option cannot be picked; set, it greys the option and shows in place of the hint. */
  disabledReason?: string;
  options?: readonly PolicyOption[];
}

/** The option, at any depth, that a pick of `value` is; a submenu is never one. */
export const pickedOption = (
  options: readonly PolicyOption[],
  value: string
): PolicyOption | undefined => {
  for (const option of options) {
    const picked = option.options ? pickedOption(option.options, value) : option;
    if (picked?.value === value) return picked;
  }
  return undefined;
};

export interface PolicyOptionItemProps {
  option: PolicyOption;
  /** The picked value, so the option holding it shows the check. */
  value: string;
}

/** One option of the picker: a radio item, or a submenu of its own options. */
export const PolicyOptionItem: React.FC<PolicyOptionItemProps> = ({ option, value }) => {
  const noteId = useId();
  const portalContainer = useResolvedPortalContainer();
  const note = option.disabledReason ?? option.hint;
  const disabled = option.disabledReason !== undefined;
  const checked = option.options
    ? pickedOption(option.options, value) !== undefined
    : option.value === value;
  const content = (
    <>
      {checked && (
        <span aria-hidden className={POLICY_CHECK_CLASS}>
          <Check />
        </span>
      )}
      <div className={POLICY_OPTION_CLASS}>
        <div className={POLICY_OPTION_TITLE_CLASS}>
          <span className={POLICY_OPTION_LABEL_CLASS}>{option.label}</span>
          {option.code && (
            <Badge variant="secondary" aria-hidden className={POLICY_OPTION_CODE_CLASS}>
              {option.code}
            </Badge>
          )}
        </div>
        {note && (
          <span aria-hidden id={noteId} className={POLICY_HINT_CLASS}>
            {note}
          </span>
        )}
      </div>
    </>
  );
  const describedBy = note ? noteId : undefined;

  if (!option.options) {
    return (
      <DropdownMenuRadioItem
        value={option.value}
        disabled={disabled}
        aria-describedby={describedBy}
        className={POLICY_ITEM_CLASS}
      >
        {content}
      </DropdownMenuRadioItem>
    );
  }
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger
        inset
        disabled={disabled}
        aria-describedby={describedBy}
        className={POLICY_ITEM_CLASS}
      >
        {content}
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal container={portalContainer}>
        <DropdownMenuSubContent className={POLICY_SUBMENU_CLASS}>
          {option.options.map((child) => (
            <PolicyOptionItem key={child.value} option={child} value={value} />
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
};
