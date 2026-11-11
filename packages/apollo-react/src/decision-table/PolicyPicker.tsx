import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@uipath/apollo-wind';
import { ChevronDown } from 'lucide-react';
import type React from 'react';
import { Fragment } from 'react';
import { type PolicyOption, PolicyOptionItem, pickedOption } from './PolicyOptionItem';
import { POLICY_CODE_CLASS, POLICY_MENU_CLASS, POLICY_TRIGGER_CLASS } from './sentenceStyles';

/** A run of options, after a separator when not the first. */
export interface PolicyGroup {
  id: string;
  label?: string;
  options: readonly PolicyOption[];
}

export interface PolicyPickerProps {
  value: string;
  groups: readonly PolicyGroup[];
  onChange: (value: string) => void;
  /** Accessible name of the trigger. */
  label: string;
  /** Ids of what describes the trigger. */
  describedBy?: string;
  /** The view's testid; derived ids: `-policy`, `-policy-menu`. */
  dataTestId: string;
}

/** The header's picker: the picked option's code and label, opening the host's grouped options. */
export const PolicyPicker: React.FC<PolicyPickerProps> = ({
  value,
  groups,
  onChange,
  label,
  describedBy,
  dataTestId,
}) => {
  const picked = pickedOption(
    groups.flatMap((group) => group.options),
    value
  );
  const pick = (next: string) => {
    if (next !== value) onChange(next);
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="4xs"
          aria-label={label}
          aria-describedby={describedBy}
          className={POLICY_TRIGGER_CLASS}
          data-testid={`${dataTestId}-policy`}
        >
          {picked?.code && (
            <>
              <span className={POLICY_CODE_CLASS}>{picked.code}</span>
              <span aria-hidden>·</span>
            </>
          )}
          <span>{picked?.label}</span>
          <ChevronDown aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className={POLICY_MENU_CLASS}
        data-testid={`${dataTestId}-policy-menu`}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <DropdownMenuRadioGroup value={value} onValueChange={pick}>
          {groups.map((group, index) => (
            <Fragment key={group.id}>
              {index > 0 && <DropdownMenuSeparator />}
              {group.label && <DropdownMenuLabel>{group.label}</DropdownMenuLabel>}
              {group.options.map((option) => (
                <PolicyOptionItem key={option.value} option={option} value={value} />
              ))}
            </Fragment>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
