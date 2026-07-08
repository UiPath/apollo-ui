import { Column } from '@uipath/apollo-react/canvas/layouts';
import { CanvasIcon, partition } from '@uipath/apollo-react/canvas/utils';
import { Skeleton } from '@uipath/apollo-wind';
import {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ListImperativeAPI, RowComponentProps } from 'react-window';
import { useCanvasTheme } from '../BaseCanvas/CanvasThemeContext';
import { CanvasTooltip } from '../CanvasTooltip';
import { InitialsBadge } from '../shared/InitialsBadge';
import { IconContainer, ListItemButton, StyledList } from './ListView.styles';

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
  /**
   * Secondary text rendered inline as the second line under the name. Also
   * revealed in the row's hover tooltip when it (or the name) is truncated.
   */
  description?: string;
  /**
   * Extra text shown only in the row's hover tooltip, never inline. Use for
   * content that would make the row too tall to show inline (e.g. a full
   * explanation) while a shorter {@link ListItem.description} stays on the row.
   */
  detail?: string;
  /**
   * Compact uppercase tag rendered at the row's trailing edge, used to
   * disambiguate same-named entries (e.g. TRIGGER / EVENT / WAIT variants of
   * a connector operation).
   */
  badge?: string;
  /** Render a thin horizontal divider line above this item. */
  dividerBefore?: boolean;
  /**
   * CSS color applied to the row's name and leading icon (e.g.
   * `var(--canvas-primary)` to emphasise a "Create new …" affordance).
   * Defaults to the inherited row colors. URL-based icons are unaffected.
   */
  contentColor?: string;
  /**
   * Icon rendered at the row's trailing edge (e.g. `arrow-up-right` to signal
   * the row opens externally). Only shown when the row has no children — the
   * drill-in chevron takes that slot otherwise.
   */
  trailingIcon?: { name: string; color?: string };
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
  | { type: 'section'; sectionName: string; first: boolean }
  | { type: 'item'; item: T }
  | { type: 'skeleton' }
  | { type: 'divider' };

const DEFAULT_SKELETON_COUNT = 3;

// Row heights are resolved per render item so dense single-line rows,
// two-line rows (with an inline `description`), section headers, and dividers
// can coexist inside one virtualized list.
export const ROW_HEIGHT_ITEM = 32;
export const ROW_HEIGHT_ITEM_TWO_LINE = 44;
// Section headers are spaced uppercase labels (no rule). They carry more top
// padding when following other rows (12px) than at the very top (4px).
export const ROW_HEIGHT_SECTION = 30;
export const ROW_HEIGHT_SECTION_FIRST = 22;
export const ROW_HEIGHT_DIVIDER = 13;

export function getRenderItemHeight<T extends ListItem>(
  renderItem: RenderItem<T> | undefined
): number {
  if (!renderItem) return ROW_HEIGHT_ITEM;
  switch (renderItem.type) {
    case 'divider':
      return ROW_HEIGHT_DIVIDER;
    case 'section':
      return renderItem.first ? ROW_HEIGHT_SECTION_FIRST : ROW_HEIGHT_SECTION;
    case 'skeleton':
      return ROW_HEIGHT_ITEM;
    default:
      return renderItem.item.description ? ROW_HEIGHT_ITEM_TWO_LINE : ROW_HEIGHT_ITEM;
  }
}

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

  const pushItem = (item: T) => {
    // Suppress a leading divider — a separator with nothing above it reads
    // as a stray line.
    if (item.dividerBefore && result.length > 0) result.push({ type: 'divider' });
    result.push({ type: 'item', item });
  };

  // `enableSections: false` means a flat list (search results) — items that
  // carry `dividerBefore` from the browse tree must not paint separators
  // between unrelated matches, mirroring how section headers are suppressed.
  if (!enableSections) {
    for (const item of items) result.push({ type: 'item', item });
    if (skeletonConfig && !skeletonConfig.sections) pushSkeletons(baseSkeletonCount);
    return result;
  }

  const [itemsWithSection, itemsWithoutSection] = partition(items, (item) => !!item.section);

  // Items without a section render at the top.
  for (const item of itemsWithoutSection) pushItem(item);

  // Group items by section in one pass; insertion order is preserved by Map.
  const itemsBySection = new Map<string, T[]>();
  for (const item of itemsWithSection) {
    const name = item.section as string;
    const bucket = itemsBySection.get(name);
    if (bucket) bucket.push(item);
    else itemsBySection.set(name, [item]);
  }

  // Map skeleton sections for O(1) lookup, then build the final section order
  // — real-item sections first, then any skeleton-only sections appended.
  const skeletonBySection = new Map(skeletonConfig?.sections?.map((s) => [s.name, s]) ?? []);
  const sectionNames = [...itemsBySection.keys()];
  for (const s of skeletonConfig?.sections ?? []) {
    if (!itemsBySection.has(s.name)) sectionNames.push(s.name);
  }

  for (const sectionName of sectionNames) {
    result.push({ type: 'section', sectionName, first: result.length === 0 });
    for (const item of itemsBySection.get(sectionName) ?? []) {
      pushItem(item);
    }
    const skeletonForSection = skeletonBySection.get(sectionName);
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

    // `style` from react-window already carries the row height (rowHeight), so
    // we only layer on the padding that insets content from the focus ring.
    const buttonStyle = useMemo(() => ({ ...style, padding: '4px 6px' }), [style]);

    // Truncation of the name / inline description, measured lazily on hover so
    // the row tooltip can reveal only the clipped lines. No persistent
    // observers — one layout read per hover.
    const nameRef = useRef<HTMLSpanElement>(null);
    const descriptionRef = useRef<HTMLSpanElement>(null);
    const [truncated, setTruncated] = useState({ name: false, description: false });

    const measureTruncation = useCallback(() => {
      const n = nameRef.current;
      const d = descriptionRef.current;
      const next = {
        name: !!n && n.scrollWidth > n.clientWidth,
        description: !!d && d.scrollWidth > d.clientWidth,
      };
      setTruncated((prev) =>
        prev.name === next.name && prev.description === next.description ? prev : next
      );
    }, []);

    const handleButtonClick = useCallback(() => {
      const clickTarget = renderedItems[index];
      if (clickTarget?.type === 'item') onItemClick(clickTarget.item, index);
    }, [onItemClick, renderedItems, index]);

    const handleButtonHover = useCallback(() => {
      measureTruncation();
      const hoverTarget = renderedItems[index];
      if (hoverTarget?.type === 'item') onItemHover?.(hoverTarget.item);
    }, [measureTruncation, onItemHover, renderedItems, index]);

    if (renderItem.type === 'section') {
      // Spaced uppercase label, no rule — the header itself is the separator.
      // Extra top padding when it follows other rows; tight at the very top.
      // Presentation-only: section headers are not listbox options, so the
      // row's `ariaAttributes` (aria-posinset/setsize) are deliberately omitted.
      return (
        <div
          role="presentation"
          style={style}
          className={`flex items-end box-border ${renderItem.first ? 'px-2 py-1' : 'px-2 pt-3 pb-1'}`}
          data-testid="list-section-header"
        >
          <span className="uppercase text-foreground-muted font-bold text-xs">
            {renderItem.sectionName}
          </span>
        </div>
      );
    }

    if (renderItem.type === 'skeleton') {
      return (
        <div style={style}>
          <ListItemSkeleton />
        </div>
      );
    }

    if (renderItem.type === 'divider') {
      // Decorative separator: presentation-only and hidden from assistive tech,
      // so the row's listbox `ariaAttributes` are deliberately omitted.
      return (
        <div
          role="presentation"
          aria-hidden="true"
          data-testid="list-item-divider"
          style={style}
          className="flex items-center box-border px-1.5"
        >
          <div className="w-full border-t border-border-de-emp" />
        </div>
      );
    }

    const item = renderItem.item;
    const bgColor = isDarkMode ? (item.colorDark ?? item.color) : item.color;

    const isActive = index === activeIndex;

    const button = (
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
          style={item.contentColor ? { color: item.contentColor } : undefined}
          data-testid="list-item-icon"
        >
          {item.icon?.url && <img src={item.icon?.url} alt={item.name} className="w-5 h-5" />}
          {item.icon?.name && <CanvasIcon icon={item.icon.name} size={20} />}
          {item.icon?.Component && <item.icon.Component />}
          {!item.icon?.url && !item.icon?.name && !item.icon?.Component && (
            <InitialsBadge name={item.name} size="20px" data-testid="list-item-initials-badge" />
          )}
        </IconContainerMemoized>
        <Column flex={1} overflow="hidden">
          <span
            ref={nameRef}
            className="text-sm list-view-item-name"
            style={item.contentColor ? { color: item.contentColor } : undefined}
          >
            {item.name}
          </span>
          {item.description && (
            <span
              ref={descriptionRef}
              className="text-xs list-view-item-name text-foreground-muted"
            >
              {item.description}
            </span>
          )}
        </Column>
        {item.badge && (
          <span
            className="shrink-0 uppercase font-semibold text-[10px] py-px px-1 rounded border border-border text-foreground-muted"
            data-testid="list-item-badge"
          >
            {item.badge}
          </span>
        )}
        {item.trailingIcon && !item.children && (
          <span data-testid="list-item-trailing-icon" className="flex shrink-0">
            <CanvasIcon
              icon={item.trailingIcon.name}
              size={16}
              color={item.trailingIcon.color ?? 'var(--canvas-foreground-de-emp)'}
            />
          </span>
        )}
        {!!item.children && (
          <CanvasIcon icon="chevron-right" size={16} color="var(--canvas-foreground-de-emp)" />
        )}
      </ListItemButton>
    );

    const showName = truncated.name;
    const showDescription = !!item.description && truncated.description;
    const showPopover = truncated.name || truncated.description || !!item.detail;
    const popover = showPopover ? (
      <div className="flex flex-col gap-0.5">
        {showName && <span className="text-sm">{item.name}</span>}
        {showDescription && (
          <span className="text-xs text-foreground-muted">{item.description}</span>
        )}
        {item.detail && <span className="text-xs">{item.detail}</span>}
      </div>
    ) : null;

    return (
      <CanvasTooltip
        key={item.id}
        content={popover}
        placement="right"
        delay
        contentClassName="max-w-64"
        hide={!showPopover}
        disableSkipDelay
      >
        {button}
      </CanvasTooltip>
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
  /**
   * Custom render for the empty state. When provided, fully replaces the
   * default Column + icon + message layout — `emptyStateIcon` and
   * `emptyStateMessage` are ignored. Loading paths still take precedence:
   * the prop is not invoked while `isLoading` or `loadingSkeleton` produce
   * placeholder rows.
   */
  renderEmptyState?: () => React.ReactElement | null;
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
 * real row's geometry — 24×24 icon tile + single name line — so the layout
 * stays stable when real items take over.
 */
const ListItemSkeleton = () => (
  <div
    className="flex items-center gap-2.5 h-8 px-1.5"
    role="presentation"
    aria-hidden="true"
    data-testid="list-item-skeleton"
  >
    <Skeleton className="h-6 w-6 shrink-0 rounded-md" />
    <Skeleton className="h-3.5 w-1/2" />
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
    renderEmptyState,
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

  const getRowHeight = useCallback(
    (index: number) => getRenderItemHeight(renderedItems[index]),
    [renderedItems]
  );

  // Show empty state when nothing would render — neither real items nor
  // skeleton placeholders. Loading-driven paths above keep `renderedItems`
  // non-empty (skeleton rows), so renderEmptyState is naturally bypassed.
  if (renderedItems.length === 0) {
    if (renderEmptyState) return renderEmptyState();
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
      rowHeight={getRowHeight}
      overscanCount={20}
      onScroll={onScroll}
    />
  );
});

export const ListView = memo(ListViewInner) as <T extends ListItem>(
  props: ListViewProps<T> & { ref?: React.Ref<ListViewHandle<T>> }
) => React.ReactElement | null;
