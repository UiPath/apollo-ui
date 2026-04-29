import { Column } from '@uipath/apollo-react/canvas/layouts';
import { CanvasIcon, partition } from '@uipath/apollo-react/canvas/utils';
import { Skeleton } from '@uipath/apollo-wind';
import { forwardRef, memo, useCallback, useImperativeHandle, useMemo } from 'react';
import type { ListImperativeAPI, RowComponentProps } from 'react-window';
import { useCanvasTheme } from '../BaseCanvas/CanvasThemeContext';
import { CanvasTooltip } from '../CanvasTooltip';
import { IconContainer, ListItemButton, SectionHeader, StyledList } from './ListView.styles';

export interface ListItemIcon {
  /**
   * Icon identifier resolved via the canvas icon registry (lucide kebab-case names or registered custom icons)
   */
  name?: string;
  /**
   * icon URL (for custom icons)
   */
  url?: string;
  /**
   * custom React component for the icon
   */
  Component?: React.ComponentType;
}

/**
 * Configuration for the skeleton placeholder shown when an item is drilled
 * into and its children are still loading.
 */
export type ChildrenLoadingSpec = {
  /** Number of skeleton rows to render when no `sections` are provided. Defaults to 3. */
  count?: number;
  /**
   * Pre-render section headers + skeleton rows under each. Once real items
   * arrive with a matching `section`, they slot under the same header so the
   * layout doesn't shift. Use this when you already know the final section
   * structure (e.g. "Published", "In this solution").
   */
  sections?: { name: string; count?: number }[];
};

export type ListItem<T = any> = {
  id: string;
  name: string;
  data: T;
  section?: string;
  description?: string;
  icon?: ListItemIcon;
  color?: string;
  colorDark?: string;
  children?: ListItem<T>[] | ((id: string, name: string) => Promise<ListItem<T>[]>);
  /**
   * When this item is drilled into and `children` resolves to an empty array,
   * render skeleton placeholder rows instead of the empty-state message.
   * Pass `true` for the default (3 rows) or a {@link ChildrenLoadingSpec} for
   * customization. Skeletons disappear once `children` updates to a non-empty
   * array.
   */
  childrenLoading?: boolean | ChildrenLoadingSpec;
};

export type RenderItem<T extends ListItem> =
  | { type: 'section'; sectionName: string }
  | { type: 'item'; item: T };

export function buildRenderedItems<T extends ListItem>(
  items: T[],
  enableSections: boolean
): RenderItem<T>[] {
  const result: RenderItem<T>[] = [];

  if (items.length === 0) return result;

  if (!enableSections) {
    // if sections are disabled, return all items as is
    for (const item of items) {
      result.push({ type: 'item', item });
    }
    return result;
  }

  const [itemsWithSection, itemsWithoutSection] = partition(items, (item) => !!item.section);

  // process items without sections first
  for (const item of itemsWithoutSection) {
    result.push({ type: 'item', item });
  }

  // return early if no items with sections
  if (itemsWithSection.length === 0) {
    return result;
  }

  // process items with sections next
  const sections = Array.from(new Set(itemsWithSection.map((item) => item.section)));

  for (const section of sections) {
    result.push({ type: 'section', sectionName: section as string });

    for (const item of itemsWithSection.filter((item) => item.section === section)) {
      result.push({ type: 'item', item });
    }
  }

  return result;
}

export interface ListViewRowProps<T extends ListItem> {
  renderedItems: RenderItem<T>[];
  activeIndex: number;
  isLoading?: boolean;
  isDarkMode?: boolean;
  onItemClick: (item: T, index: number) => void;
  onItemHover?: (item: T) => void;
}

const IconContainerMemoized = memo(IconContainer);

const ListViewRow = memo(
  <T extends ListItem>({
    index,
    style,
    ariaAttributes,
    renderedItems,
    activeIndex,
    isLoading,
    isDarkMode,
    onItemClick,
    onItemHover,
  }: RowComponentProps<ListViewRowProps<T>>) => {
    const renderItem = renderedItems[index]!;

    const buttonStyle = useMemo(
      () => ({ ...style, padding: 0, paddingRight: '4px', height: '32px', outlineOffset: '-1px' }),
      [style]
    );

    const handleButtonClick = useCallback(() => {
      const clickTarget = renderedItems[index];
      if (clickTarget?.type === 'item' && !isSkeletonItem(clickTarget.item)) {
        onItemClick(clickTarget.item, index);
      }
    }, [onItemClick, renderedItems, index]);

    const handleButtonHover = useCallback(() => {
      const hoverTarget = renderedItems[index];
      if (hoverTarget?.type === 'item' && !isSkeletonItem(hoverTarget.item)) {
        onItemHover?.(hoverTarget.item);
      }
    }, [onItemHover, renderedItems, index]);

    if (renderItem.type === 'section') {
      return (
        <SectionHeader {...ariaAttributes} style={style}>
          <span className="text-xs">{renderItem.sectionName}</span>
        </SectionHeader>
      );
    }

    const item = renderItem.item;

    // Skeleton sentinels render as the placeholder bar, never as a clickable
    // row. They can't appear in `activeIndex` because Toolbox's keyboard
    // navigation skips items injected by ListView itself.
    if (isSkeletonItem(item)) {
      return (
        <div style={style}>
          <ListItemSkeleton />
        </div>
      );
    }
    const bgColor = isDarkMode ? (item.colorDark ?? item.color) : item.color;

    const isActive = index === activeIndex;

    return (
      <ListItemButton
        {...ariaAttributes}
        tabIndex={-1}
        id={`toolbox-item-${item.id}`}
        role="option"
        aria-selected={isActive}
        style={buttonStyle}
        onClick={handleButtonClick}
        onHoverStart={handleButtonHover}
        className={`${isLoading ? 'loading' : ''} ${isActive ? 'active' : ''}`}
        disabled={isLoading}
      >
        <IconContainerMemoized
          bgColor={bgColor}
          color="var(--canvas-foreground-emp)"
          data-testid="list-item-icon"
        >
          {item.icon?.url && (
            <img src={item.icon?.url} alt={item.name} style={{ width: 24, height: 24 }} />
          )}
          {item.icon?.name && <CanvasIcon icon={item.icon.name} size={24} />}
          {item.icon?.Component && <item.icon.Component />}
        </IconContainerMemoized>
        <Column flex={1} overflow="hidden">
          <CanvasTooltip content={item.name} placement="right" smartTooltip>
            <span className="text-sm list-view-item-name">{item.name}</span>
          </CanvasTooltip>
          {item.description && (
            <CanvasTooltip content={item.description} placement="right" smartTooltip>
              <span className="text-xs list-view-item-name text-foreground-muted">
                {item.description}
              </span>
            </CanvasTooltip>
          )}
        </Column>
        {!!item.children && (
          <CanvasIcon icon="chevron-right" size={20} color="var(--canvas-foreground-de-emp)" />
        )}
      </ListItemButton>
    );
  }
) as <T extends ListItem>(props: RowComponentProps<ListViewRowProps<T>>) => React.ReactElement;

export interface ListViewHandle<T extends ListItem = ListItem> {
  renderedItems: RenderItem<T>[];
}

interface ListViewProps<T extends ListItem> {
  items: T[];
  activeIndex?: number;
  listRef?: React.RefObject<ListImperativeAPI | null>;
  onItemClick: (item: T, index: number) => void;
  onItemHover?: (item: T) => void;
  onScroll?: React.UIEventHandler<HTMLDivElement>;
  emptyStateMessage?: string;
  emptyStateIcon?: string;
  isLoading?: boolean;
  enableSections?: boolean;
  /**
   * Render skeleton placeholder rows when `items` is empty, independent of
   * `isLoading`. Accepts the same shape as {@link ListItem.childrenLoading}.
   * Use this when you want to show "more on the way" without disabling the
   * rest of the panel (which `isLoading` does via the `.loading` row class).
   */
  loadingSkeleton?: boolean | ChildrenLoadingSpec;
}

/**
 * Skeleton row used for the {@link ListItem.childrenLoading} drill-in path
 * and the legacy `isLoading && items.length === 0` empty-state. Mirrors a
 * real row's geometry — 32×32 icon + name + description — so the layout
 * stays stable when real items take over.
 */
const ListItemSkeleton = () => (
  <div
    className="flex items-center gap-2.5 h-8 px-2"
    role="presentation"
    aria-hidden="true"
    data-testid="list-item-skeleton"
  >
    <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
    <div className="flex-1 space-y-1.5 min-w-0">
      <Skeleton className="h-3.5 w-1/3" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  </div>
);

// Internal id prefix used to mark skeleton sentinel items injected by
// `ListView`. Consumers must not produce ids with this prefix.
const SKELETON_ID_PREFIX = '__listview_skeleton__';
const isSkeletonItem = (item: ListItem): boolean => item.id.startsWith(SKELETON_ID_PREFIX);

/**
 * Build the synthetic skeleton ListItem entries that get appended to the
 * caller's `items` while `loadingSkeleton` is active. These flow through the
 * normal section-grouping pipeline so real items with a matching `section`
 * end up under the same header — and inserting them as ListItems means
 * react-window virtualizes them just like any other row.
 */
function buildSkeletonItems(spec: boolean | ChildrenLoadingSpec): ListItem[] {
  const config: ChildrenLoadingSpec = typeof spec === 'object' ? spec : {};
  const defaultCount = config.count ?? 3;
  const make = (id: string, section?: string): ListItem => ({
    id: `${SKELETON_ID_PREFIX}${id}`,
    name: '',
    data: {},
    ...(section ? { section } : {}),
  });

  if (config.sections && config.sections.length > 0) {
    return config.sections.flatMap((s) =>
      Array.from({ length: s.count ?? defaultCount }, (_, i) => make(`${s.name}-${i}`, s.name))
    );
  }
  return Array.from({ length: defaultCount }, (_, i) => make(`${i}`));
}

const ListViewInner = forwardRef(function ListView<T extends ListItem>(
  {
    items,
    activeIndex = -1,
    listRef,
    onItemClick,
    onItemHover,
    onScroll,
    emptyStateMessage = 'No items found',
    emptyStateIcon = 'search-x',
    isLoading = false,
    enableSections = true,
    loadingSkeleton,
  }: ListViewProps<T>,
  ref: React.Ref<ListViewHandle<T>>
) {
  const { isDarkMode } = useCanvasTheme();

  // Merge skeleton sentinel rows with the caller's items so they flow through
  // the normal section-grouping + virtualization pipeline. `loadingSkeleton`
  // is the opt-in per-drill-in path; the legacy `isLoading && items.length
  // === 0` behaviour is preserved by falling through to a `true` spec.
  const activeSkeleton = loadingSkeleton ?? (isLoading && items.length === 0 ? true : null);
  const skeletonItems = useMemo(
    () => (activeSkeleton ? buildSkeletonItems(activeSkeleton) : []),
    [activeSkeleton]
  );
  const allItems = useMemo(
    () => (skeletonItems.length > 0 ? [...items, ...skeletonItems] : items),
    [items, skeletonItems]
  );

  const renderedItems = useMemo(
    () => buildRenderedItems(allItems, enableSections),
    [allItems, enableSections]
  );

  useImperativeHandle(ref, () => ({ renderedItems }), [renderedItems]);

  const rowProps = useMemo(
    () => ({ renderedItems, activeIndex, isLoading, isDarkMode, onItemClick, onItemHover }),
    [renderedItems, activeIndex, isLoading, isDarkMode, onItemClick, onItemHover]
  );

  // Show empty state if neither real items nor skeletons would render.
  if (allItems.length === 0) {
    return (
      <Column align="center" justify="center" flex={1} gap={10} style={{ minHeight: '250px' }}>
        <CanvasIcon icon={emptyStateIcon} size={48} color="var(--canvas-foreground-de-emp)" />
        <span className="text-xs text-foreground-muted">{emptyStateMessage}</span>
      </Column>
    );
  }

  return (
    <StyledList
      id="toolbox-listbox"
      role="listbox"
      listRef={listRef}
      rowProps={rowProps}
      rowComponent={ListViewRow}
      rowCount={renderedItems.length}
      rowHeight={40}
      overscanCount={20}
      onScroll={onScroll}
    />
  );
});

export const ListView = memo(ListViewInner) as <T extends ListItem>(
  props: ListViewProps<T> & { ref?: React.Ref<ListViewHandle<T>> }
) => React.ReactElement | null;
