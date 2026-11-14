import { Button } from '@uipath/apollo-wind';
import type React from 'react';
import {
  POPOVER_ACTIONS_CLASS,
  POPOVER_APPLY_DIMMED_CLASS,
  POPOVER_FOOTER_CLASS,
  POPOVER_LINK_CLASS,
  POPOVER_LINKS_CLASS,
} from './sentenceStyles';

/** The footer's strings. */
export interface PopoverFooterLabels {
  cancel: string;
  apply: string;
}

/** A link before the actions, e.g. Edit expression. */
export interface PopoverFooterLink {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  dataTestId: string;
}

export interface PopoverFooterProps {
  ref?: React.Ref<HTMLDivElement>;
  links: readonly PopoverFooterLink[];
  onCancel: () => void;
  onApply: () => void;
  applyDisabled?: boolean;
  /** Shows Apply as off while it stays pressable, so a press still takes focus from an editor that commits on blur. */
  applyDimmed?: boolean;
  applyKeepsFocus?: boolean;
  labels: PopoverFooterLabels;
  /** The popover's testid; derived ids: `-cancel`, `-apply`. */
  dataTestId: string;
}

export const keepFocus = (event: React.MouseEvent) => event.preventDefault();

/** The popover's actions: its links, then Cancel and Apply, wrapping before they overflow. */
export const PopoverFooter: React.FC<PopoverFooterProps> = ({
  ref,
  links,
  onCancel,
  onApply,
  applyDisabled = false,
  applyDimmed = false,
  applyKeepsFocus = true,
  labels,
  dataTestId,
}) => (
  <div ref={ref} className={POPOVER_FOOTER_CLASS}>
    {links.length > 0 && (
      <div className={POPOVER_LINKS_CLASS}>
        {links.map((link) => (
          <Button
            key={link.dataTestId}
            type="button"
            variant="link"
            size="sm"
            className={POPOVER_LINK_CLASS}
            onMouseDown={keepFocus}
            onClick={link.onClick}
            data-testid={link.dataTestId}
          >
            {link.icon}
            {link.label}
          </Button>
        ))}
      </div>
    )}
    <div className={POPOVER_ACTIONS_CLASS}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onMouseDown={keepFocus}
        onClick={onCancel}
        data-testid={`${dataTestId}-cancel`}
      >
        {labels.cancel}
      </Button>
      <Button
        type="button"
        size="sm"
        disabled={applyDisabled}
        aria-disabled={applyDimmed || undefined}
        className={POPOVER_APPLY_DIMMED_CLASS}
        onMouseDown={applyKeepsFocus ? keepFocus : undefined}
        onClick={onApply}
        data-testid={`${dataTestId}-apply`}
      >
        {labels.apply}
      </Button>
    </div>
  </div>
);
