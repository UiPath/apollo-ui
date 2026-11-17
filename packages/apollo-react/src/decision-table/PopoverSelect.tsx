import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@uipath/apollo-wind';
import type React from 'react';
import { useRef } from 'react';
import { POPOVER_FIELD_CLASS, POPOVER_ICON_CLASS, POPOVER_OPTION_CLASS } from './sentenceStyles';

/** One option a popover's select offers: the id its pick carries, its words and its glyph. */
export interface PopoverSelectOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface PopoverSelectProps
  extends Pick<React.ComponentProps<typeof Select>, 'open' | 'onOpenChange'> {
  value: string;
  options: readonly PopoverSelectOption[];
  onChange: (id: string) => void;
  /** Where focus goes once the list closes, in place of the trigger; the trigger when it names none that takes focus. */
  returnFocus?: () => HTMLElement | null;
  /** Where the list renders, so picking from it keeps focus inside the popover. */
  container: HTMLElement | null;
  label: string;
  id?: string;
  dataTestId: string;
}

/** The options a select can offer: none with an empty id, and only the first of each id. */
const selectable = (options: readonly PopoverSelectOption[]): readonly PopoverSelectOption[] =>
  options.filter(
    ({ id }, index) => id !== '' && options.findIndex((option) => option.id === id) === index
  );

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
}) => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <Select value={value} onValueChange={onChange} open={open} onOpenChange={onOpenChange}>
      <SelectTrigger
        ref={triggerRef}
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
            const target = returnFocus();
            target?.focus();
            const root = target?.getRootNode();
            const active =
              root !== undefined && 'activeElement' in root ? root.activeElement : null;
            const landed = active instanceof Node && target?.contains(active) === true;
            if (!landed) triggerRef.current?.focus();
          })
        }
      >
        {selectable(options).map((option) => (
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
};
