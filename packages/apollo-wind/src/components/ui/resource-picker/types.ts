import type { ReactElement, ReactNode } from 'react';

export interface ResourceItem {
  /**
   * Row identity, unique across every group. Labels are not: the same name
   * can appear under two groups, so the id is what a row is keyed, matched
   * and reported by.
   */
  id: string;
  label: string;
  /** Leading glyph for the row, such as the resource's type icon. */
  icon?: ReactNode;
  /** Secondary text after the label, such as an email or a count. */
  description?: string;
  /** A second line under the label, such as a status. Not searched. */
  subtitle?: ReactNode;
  /** Extra terms the search matches, for detail the row does not print. */
  keywords?: string[];
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
  /** Controls the query from outside, for a consumer-owned search box. */
  query?: string;
  onQueryChange?: (query: string) => void;
  emptyText?: string;
  /** Accessible name for the row list. */
  listLabel?: string;
  /** Hides the per-group count at the header's trailing edge. */
  showCounts?: boolean;
  /**
   * Trailing controls for a row, such as Edit. Revealed on the row under the
   * cursor. A click on them does not commit the row. They are pointer
   * shortcuts, not the only route to their action: a listbox option is atomic
   * to assistive technology, so anything here must also be reachable elsewhere.
   */
  renderItemActions?: (item: ResourceItem) => ReactNode;
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
  /** Rendered inside the field at its trailing edge, such as a field-mode menu. */
  trailingAdornment?: ReactNode;
  /**
   * Validation state of the field. `error` also marks it invalid for
   * assistive technology. The message itself belongs to the consumer, linked
   * through `aria-describedby`.
   */
  status?: 'error' | 'warning';
  'aria-describedby'?: string;
  contentClassName?: string;
  className?: string;
}

/**
 * A group whose own label matches keeps every row, since someone searching a
 * folder name wants what is in it. Otherwise rows are matched one by one, and
 * a group is kept only while it still has a match, so no empty header
 * survives a search.
 */
export const filterGroups = (groups: ResourceGroup[], query: string): ResourceGroup[] => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return groups;

  return groups
    .map((group) =>
      group.label.toLowerCase().includes(normalizedQuery)
        ? group
        : {
            ...group,
            items: group.items.filter(
              (item) =>
                item.label.toLowerCase().includes(normalizedQuery) ||
                item.description?.toLowerCase().includes(normalizedQuery) === true ||
                item.keywords?.some((keyword) =>
                  keyword.toLowerCase().includes(normalizedQuery)
                ) === true
            ),
          }
    )
    .filter((group) => group.items.length > 0);
};
