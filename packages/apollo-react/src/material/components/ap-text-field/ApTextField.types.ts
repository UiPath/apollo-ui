import React from 'react';

export type TextFieldSize = 'tall' | 'small';

export type InputType = 'url' | 'text' | 'number' | 'email' | 'password' | 'search';

export interface ApTextFieldProps<T extends InputType = 'text'>
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'onChange'> {
  /** Label text for the field */
  label?: string;
  /** Size variant (default: tall) */
  size?: TextFieldSize;
  /** Tooltip to show when field is read-only */
  readOnlyTooltip?: string;
  /** Error state */
  error?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Helper text to display below input */
  helperText?: string;
  /** Input type */
  type?: T;
  /** Start adornment (icon or text) */
  startAdornment?: React.ReactNode;
  /** End adornment (icon or text) */
  endAdornment?: React.ReactNode;
  /** Custom styles */
  customStyle?: React.CSSProperties;
  /** Minimum value (number type only) */
  min?: T extends 'number' ? number : never;
  /** Maximum value (number type only) */
  max?: T extends 'number' ? number : never;
  /** Step value (number type only) */
  step?: T extends 'number' ? number : never;
  /** Data test ID for testing */
  dataTestid?: string;
  /** FIXME: BACKWARDS COMPATIBILIT Yreceives the input value directly) */
  onChange?: (value: string) => void;
}
