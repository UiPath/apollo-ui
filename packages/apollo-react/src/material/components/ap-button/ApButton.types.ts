import type { ButtonProps } from '@mui/material';
import type { FocusEventHandler, KeyboardEventHandler, MouseEventHandler, ReactNode } from 'react';

export type ButtonVariants =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'destructive'
  | 'text'
  | 'text-foreground';
export type ButtonTypes = 'button' | 'submit' | 'reset';
export type ButtonSizes = 'tall' | 'small';
export type ButtonWidthModes = 'default' | 'fit-content';

export interface ApButtonProps extends Omit<ButtonProps, 'size' | 'variant' | 'type'> {
  /** Sets the label of the button */
  label: string;
  /** Sets the id of the button */
  id?: string;
  /** Sets the type of the button */
  type?: ButtonTypes;
  /** If `true`, the button will be disabled. */
  disabled?: boolean;
  /** If `true`, the button will be disabled and show a loading indicator. */
  loading?: boolean;
  /** Sets the variant of the button */
  variant?: ButtonVariants;
  /** Sets the height of the button */
  size?: ButtonSizes;
  /** Sets the width of the button default has min width 120px */
  widthMode?: ButtonWidthModes;
  /** Sets the start icon of the button */
  startIcon?: ReactNode;
  /** Sets the end icon of the button */
  endIcon?: ReactNode;
  /** Sets the custom content of the button, replacing the label value */
  customContent?: ReactNode;
  onClick?: MouseEventHandler;
  /** Sets the href of the button */
  href?: string;
  /** Sets the tab index of the button */
  tabIndex?: number;
  /** If `true`, sets `aria-expanded` to true */
  expanded?: boolean;
  /** Sets the title attribute of the button */
  title?: string;
  onMouseEnter?: MouseEventHandler;
  onMouseLeave?: MouseEventHandler;
  onMouseDown?: MouseEventHandler;
  onMouseUp?: MouseEventHandler;
  onFocus?: FocusEventHandler;
  onBlur?: FocusEventHandler;
  onKeyDown?: KeyboardEventHandler;
}
