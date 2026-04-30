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
 *
 * For best perf, callers passing this as an object should memoize it —
 * passing a fresh object each render rebuilds the skeleton items and
 * cascades through the row virtualizer.
 */
export type ChildrenLoadingSpec = {
  /**
   * Number of skeleton rows. When `sections` is set, this is the per-section
   * default for any section that omits its own `count`. Defaults to 3.
   */
  count?: number;
  /**
   * Pre-render section headers + skeleton rows under each. Once real items
   * arrive with a matching `section`, they slot under the same header so the
   * layout doesn't shift. Each section's `count` overrides the top-level
   * `count` (or the built-in default of 3).
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
  | { type: 'item'; item: T }
  | { type: 'skeleton' };

const DEFAULT_SKELETON_COUNT = 3;

export function buildRenderedItems<T extends ListItem>(
  items: T[],
  enableSections: boolean,
  loadingSkeleton?: boolean | ChildrenLoadingSpec
): RenderItem<T>[] {
  const result: RenderItem<T>[] = [];
  const skeletonConfig: ChildrenLoadingSpec | undefined =
    typeof loadingSkeleton === 'object' ? loadingSkeleton : loadingSkeleton ? {} : undefined;
  const baseSkeletonCount = skeletonConfig?.count ?? DEFAULT_SKELETON_COUNT;

  // Skeletons are emitted as `{ type: 'skeleton' }` so they're a distinct
  // shape from real items. That keeps clicks / hovers / keyboard nav (which
  // all filter on `type === 'item'`) auto-skipping them without per-row
  // sentinel checks.
  const pushSkeletons = (count: number) => {
    for (let i = 0; i < count; i++) result.push({ type: 'skeleton' });
  };

  if (!enableSections) {
    for (const item of items) result.push({ type: 'item', item });
    if (skeletonConfig && !skeletonConfig.sections) pushSkeletons(baseSkeletonCount);
    return result;
  }

  const [itemsWithSection, itemsWithoutSection] = partition(items, (item) => !!item.section);

  // Items without a section render at the top.
  for (const item of itemsWithoutSection) result.push({ type: 'item', item });

  // Build the union of section names from real items + preemptive skeleton
  // sections, preserving insertion order. Real-item sections come first to
  // match the existing behaviour.
  const sectionNames: string[] = [];
  const seenSections = new Set<string>();
  for (const item of itemsWithSection) {
    const name = item.section as string;
    if (!seenSections.has(name)) {
      seenSections.add(name);
      sectionNames.push(name);
    }
  }
  if (skeletonConfig?.sections) {
    for (const s of skeletonConfig.sections) {
      if (!seenSections.has(s.name)) {
        seenSections.add(s.name);
        sectionNames.push(s.name);
      }
    }
  }

  for (const sectionName of sectionNames) {
    result.push({ type: 'section', sectionName });
    for (const item of itemsWithSection) {
      if (item.section === sectionName) result.push({ type: 'item', item });
    }
    const skeletonForSection = skeletonConfig?.sections?.find((s) => s.name === sectionName);
    if (skeletonForSection) {
      pushSkeletons(skeletonForSection.count ?? baseSkeletonCount);
    }
  }

  // Skeletons without sections trail the list. Suppressed when the spec uses
  // `sections` (those skeletons are already emitted under their headers).
  if (skeletonConfig && !skeletonConfig.sections) {
    pushSkeletons(baseSkeletonCount);
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
      if (clickTarget?.type === 'item') onItemClick(clickTarget.item, index);
    }, [onItemClick, renderedItems, index]);

    const handleButtonHover = useCallback(() => {
      const hoverTarget = renderedItems[index];
      if (hoverTarget?.type === 'item') onItemHover?.(hoverTarget.item);
    }, [onItemHover, renderedItems, index]);

    if (renderItem.type === 'section') {
      return (
        <SectionHeader {...ariaAttributes} style={style}>
          <span className="text-xs">{renderItem.sectionName}</span>
        </SectionHeader>
      );
    }

    if (renderItem.type === 'skeleton') {
      return (
        <div style={style}>
          <ListItemSkeleton />
        </div>
      );
    }

    const item = renderItem.item;
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
    className="flex items-center gap-2.5 h-8"
    role="presentation"
    aria-hidden="true"
    data-testid="list-item-skeleton"
  >
    <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
    <div className="flex-1 space-y-1.5 min-w-0">
      <Skeleton className="h-3.5 w-1/3" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  </div>
);

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

  // The legacy `isLoading && items.length === 0` empty-state path is preserved
  // by falling through to a `true` spec, which `buildRenderedItems` turns into
  // 3 default skeleton rows.
  const activeSkeleton = loadingSkeleton ?? (isLoading && items.length === 0 ? true : undefined);

  const renderedItems = useMemo(
    () => buildRenderedItems(items, enableSections, activeSkeleton),
    [items, enableSections, activeSkeleton]
  );

  useImperativeHandle(ref, () => ({ renderedItems }), [renderedItems]);

  const rowProps = useMemo(
    () => ({ renderedItems, activeIndex, isLoading, isDarkMode, onItemClick, onItemHover }),
    [renderedItems, activeIndex, isLoading, isDarkMode, onItemClick, onItemHover]
  );

  // Show empty state when nothing would render — neither real items nor
  // skeleton placeholders.
  if (renderedItems.length === 0) {
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
      // Signal "list is being updated" to assistive tech while skeleton
      // sentinels are rendered in place of real items.
      aria-busy={activeSkeleton ? true : undefined}
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
