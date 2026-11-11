import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@uipath/apollo-wind';
import type React from 'react';
import { POPOVER_FIELD_CLASS, POPOVER_ICON_CLASS, POPOVER_OPTION_CLASS } from './sentenceStyles';

/** One option a popover's select offers: the id its pick carries, its words and its glyph. */
export interface PopoverSelectOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface PopoverSelectProps {
  value: string;
  options: readonly PopoverSelectOption[];
  onChange: (id: string) => void;
  /** Controls the list, for a shortcut that opens it from elsewhere. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Where focus goes once the list closes, in place of the trigger. */
  returnFocus?: () => void;
  /** Where the list renders, so picking from it keeps focus inside the popover. */
  container: HTMLElement | null;
  label: string;
  id?: string;
  dataTestId: string;
}

/** A popover's select over the host's options. */
export const PopoverSelect: React.FC<PopoverSelectProps> = ({
  value,
  options,
  onChange,
  open,
  onOpenChange,
  returnFocus,
  container,
  label,
  id,
  dataTestId,
}) => (
  <Select value={value} onValueChange={onChange} open={open} onOpenChange={onOpenChange}>
    <SelectTrigger
      id={id}
      aria-label={label}
      className={POPOVER_FIELD_CLASS}
      data-testid={dataTestId}
    >
      <SelectValue />
    </SelectTrigger>
    <SelectContent
      container={container}
      onCloseAutoFocus={
        returnFocus &&
        ((event) => {
          event.preventDefault();
          returnFocus();
        })
      }
    >
      {options.map((option) => (
        <SelectItem key={option.id} value={option.id}>
          <span className={POPOVER_OPTION_CLASS}>
            {option.icon && (
              <span aria-hidden className={POPOVER_ICON_CLASS}>
                {option.icon}
              </span>
            )}
            {option.label}
          </span>
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);
