import type { AriaAttributes, ReactElement, ReactNode } from 'react';

export interface ResourceItem {
  /**
   * Row identity, unique across every group and never empty. Labels are not
   * unique: the same name can appear under two groups, so the id is what a
   * row is keyed, matched and reported by. `''` is the picker's "no value",
   * so a row with an empty id is dropped. It may not begin with U+E000, which
   * the picker reserves for its own heading options.
   */
  id: string;
  label: string;
  /** Leading glyph for the row, such as the resource's type icon. */
  icon?: ReactNode;
  /** Secondary text after the label, such as an email or a count. */
  description?: string;
  disabled?: boolean;
  metadata?: unknown;
}

export interface ResourceGroup {
  /** Group identity, and the key its collapsed state is held under. */
  id: string;
  label: string;
  items: ResourceItem[];
  /** Leading glyph for the group header. Defaults to a folder. */
  icon?: ReactNode;
  /** Starts the group collapsed. Groups are expanded by default. */
  defaultCollapsed?: boolean;
}

export interface ResourcePickerContentProps {
  groups: ResourceGroup[];
  /** Commits a row. There is no confirm step: one resource is one decision. */
  onSelect: (item: ResourceItem) => void;
  /** Id of the committed row, which takes the chosen styling. */
  value?: string;
  searchPlaceholder?: string;
  /** Seeds the search box, as FolderPicker's `initialSearch` does. */
  initialSearch?: string;
  /**
   * Controls the query from outside, for a consumer-owned search box. Pair it
   * with `onQueryChange`: without one the query is read-only, and Escape then
   * dismisses rather than trying to clear it.
   */
  query?: string;
  onQueryChange?: (query: string) => void;
  emptyText?: string;
  /**
   * Shown when the search matches no row, given the trimmed query, as
   * FolderPicker's `noMatchText` is. Defaults to `No results match “…”.`
   */
  noMatchText?: (query: string) => string;
  /**
   * Spoken name of a collapsed group's heading, given the group label.
   * Defaults to `${label}, collapsed`.
   */
  collapsedGroupLabel?: (label: string) => string;
  /**
   * Spoken name of an open group's heading when every row in it is disabled,
   * the one case where the heading takes the keyboard cursor so the group can
   * still be folded. Given the group label. Defaults to `${label}, expanded`.
   */
  expandedGroupLabel?: (label: string) => string;
  /** Accessible name for the row list. */
  listLabel?: string;
  /** Hides the per-group count at the header's trailing edge. */
  showCounts?: boolean;
  /** Footer's leading slot, such as an "Add new" link. */
  footerLeading?: ReactNode;
  /** Footer's trailing slot, such as a link out to the managing surface. */
  footerTrailing?: ReactNode;
  className?: string;
}

export interface ResourcePickerProps extends Omit<ResourcePickerContentProps, 'className'> {
  /** Clears the field. Without it the clear control is not offered. */
  onClear?: () => void;
  placeholder?: string;
  disabled?: boolean;
  /** Hides the field's hover-revealed clear control. */
  clearable?: boolean;
  clearAriaLabel?: string;
  /** Leading glyph for the field, matching the kind of row it picks. */
  icon?: ReactNode;
  /** A single element Radix can anchor the popover to. Replaces the default field. */
  children?: ReactElement;
  align?: 'start' | 'center' | 'end';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * Rendered inside the default field at its trailing edge, such as a
   * field-mode menu. Ignored with custom `children`, which own their layout.
   */
  trailingAdornment?: ReactNode;
  contentClassName?: string;
  className?: string;
  /**
   * Applied to the default trigger, so a `<label htmlFor>` pointing at it
   * associates correctly. A custom `children` trigger takes its own.
   */
  id?: string;
  /** Id of the element naming this control, forwarded to the default trigger. */
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: AriaAttributes['aria-invalid'];
  'aria-errormessage'?: string;
}

/** `''` is the picker's "no value", so a row needs an id to be chosen by. */
const hasId = (item: ResourceItem) => item.id !== '';

/**
 * Rows with an empty id are dropped first, since no selection could tell
 * them apart from none. A group whose own label matches keeps every row, since someone searching a
 * folder name wants what is in it. Otherwise rows are matched one by one, and
 * a group is kept only while it still has a match, so no empty header
 * survives a search. A group with no rows is dropped even without one, so a
 * picker whose groups are all empty reaches the empty state.
 */
export const filterGroups = (allGroups: ResourceGroup[], query: string): ResourceGroup[] => {
  const groups = allGroups.map((group) =>
    group.items.every(hasId) ? group : { ...group, items: group.items.filter(hasId) }
  );
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return groups.filter((group) => group.items.length > 0);

  return groups
    .map((group) =>
      group.label.toLowerCase().includes(normalizedQuery)
        ? group
        : {
            ...group,
            items: group.items.filter(
              (item) =>
                item.label.toLowerCase().includes(normalizedQuery) ||
                item.description?.toLowerCase().includes(normalizedQuery) === true
            ),
          }
    )
    .filter((group) => group.items.length > 0);
};
