// src/types/components.ts - TypeScript types for component utilities

/**
 * Component utility class names
 */

export type ButtonUtility =
  | 'btn'
  | 'btn-tall'
  | 'btn-small'
  | 'btn-primary-colors'
  | 'btn-secondary-colors'
  | 'btn-tertiary-colors'
  | 'btn-destructive-colors'
  | 'btn-text-foreground-colors'
  | 'btn-loading';

export type IconButtonUtility = 'icon-btn' | 'icon-btn-medium' | 'icon-btn-small';

export type CardUtility = 'card' | 'card-elevated' | 'card-outlined';

export type InputUtility = 'input' | 'input-error' | 'input-success';

export type SelectUtility = 'select';

export type CheckboxUtility = 'checkbox';

export type RadioUtility = 'radio';

export type SwitchUtility = 'switch';

export type TextareaUtility = 'textarea';

export type BadgeUtility =
  | 'badge'
  | 'badge-small-size'
  | 'badge-large-size'
  | 'badge-default-colors'
  | 'badge-primary-colors'
  | 'badge-error-colors'
  | 'badge-warning-colors'
  | 'badge-success-colors'
  | 'badge-info-colors';

export type ChipUtility =
  | 'chip'
  | 'chip-default'
  | 'chip-primary'
  | 'chip-error'
  | 'chip-warning'
  | 'chip-success'
  | 'chip-info';

export type AlertUtility =
  | 'alert'
  | 'alert-error'
  | 'alert-warning'
  | 'alert-success'
  | 'alert-info';

export type ToastUtility =
  | 'toast'
  | 'toast-error'
  | 'toast-warning'
  | 'toast-success'
  | 'toast-info';

export type ProgressUtility = 'progress' | 'progress-bar';

export type LoaderUtility = 'loader' | 'loader-sm' | 'loader-lg';

export type TooltipUtility = 'tooltip';

export type IconSizeUtility = 'icon-xs' | 'icon-sm' | 'icon-md' | 'icon-lg' | 'icon-xl';

/**
 * All component utilities combined
 */
export type ComponentUtility =
  | ButtonUtility
  | IconButtonUtility
  | CardUtility
  | InputUtility
  | SelectUtility
  | CheckboxUtility
  | RadioUtility
  | SwitchUtility
  | TextareaUtility
  | BadgeUtility
  | ChipUtility
  | AlertUtility
  | ToastUtility
  | ProgressUtility
  | LoaderUtility
  | TooltipUtility
  | IconSizeUtility;
