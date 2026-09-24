import type { ReactElement, ReactNode } from 'react';

export interface FolderPickerEntry {
  /** Segment name as it appears in the path. Unique among its siblings. */
  name: string;
  /** Row label. Defaults to `name`. */
  label?: string;
  /** False marks a known leaf, which hides its open affordance. Unknown by default. */
  hasChildren?: boolean;
  disabled?: boolean;
  metadata?: unknown;
}

/**
 * Loads one level of the tree. The root is requested with an empty path.
 * Resolved levels are cached, so navigating back up does not re-request.
 */
export type FolderPickerLoadChildren = (path: string[]) => Promise<FolderPickerEntry[]>;

export interface FolderPickerContentProps {
  /** Loads a level of the tree. Called for the root when the content mounts. */
  onLoadChildren: FolderPickerLoadChildren;
  /** Confirms a folder path, such as `/Finance/Invoices`. */
  onSelect: (path: string) => void;
  /** Closes the surface without confirming. */
  onCancel?: () => void;
  /** Browsing resumes at this path's parent, with the path itself highlighted. */
  initialPath?: string;
  /** Label for the breadcrumb's first segment. */
  rootLabel?: string;
  searchPlaceholder?: string;
  /** Seeds the search box, as VariablePicker's `initialQuery` does. */
  initialSearch?: string;
  emptyText?: string;
  /** Shown while a level that has never resolved is loading. */
  loadingText?: string;
  /** Accessible name for the folder list. */
  listLabel?: string;
  /** Content for the footer's leading slot, such as a count or an "Add new" link. */
  footerLeading?: ReactNode;
  cancelLabel?: string;
  selectLabel?: string;
  className?: string;
}

export interface FolderPickerProps
  extends Omit<FolderPickerContentProps, 'onCancel' | 'initialPath' | 'className'> {
  /** Selected folder path, or an empty string. */
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Hides the field's hover-revealed clear control. */
  clearable?: boolean;
  clearAriaLabel?: string;
  /** A single element Radix can anchor the popover to. Replaces the default field. */
  children?: ReactElement;
  align?: 'start' | 'center' | 'end';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Rendered inside the field at its trailing edge, such as a field-mode menu. */
  trailingAdornment?: ReactNode;
  contentClassName?: string;
  className?: string;
}

export const joinPath = (segments: string[]) => `/${segments.join('/')}`;
export const cacheKey = (segments: string[]) => segments.join('/');
