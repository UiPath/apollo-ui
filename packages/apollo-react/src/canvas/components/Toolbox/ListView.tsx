import { ApIcon, ApSkeleton, ApTypography } from '@uipath/portal-shell-react';
import { Column } from '@uipath/apollo-react/canvas/layouts';
import { partition } from '@uipath/apollo-react/canvas/utils';
import { FontVariantToken } from '@uipath/apollo-core';
import { useMemo } from 'react';
import type { RowComponentProps } from 'react-window';
import { IconContainer, ListItemButton, SectionHeader, StyledList } from './ListView.styles';

export interface ListItemIcon {
  /**
   * icon name from ApIcon (Material Icons)
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

export type ListItem<T = any> = {
  id: string;
  name: string;
  data: T;
  section?: string;
  description?: string;
  icon?: ListItemIcon;
  color?: string;
  children?: ListItem<T>[] | ((id: string, name: string) => Promise<ListItem<T>[]>);
};

type RenderItem<T extends ListItem> =
  | { type: 'section'; sectionName: string }
  | { type: 'item'; item: T };

export interface ListViewRowProps<T extends ListItem> {
  renderedItems: RenderItem<T>[];
  isLoading?: boolean;
  onItemClick: (item: T) => void;
  onItemHover?: (item: T) => void;
  getItemColor?: (item: T) => string | undefined;
}

const ListViewRow = <T extends ListItem>({
  index,
  style,
  ariaAttributes,
  renderedItems,
  isLoading,
  onItemClick,
  onItemHover,
  getItemColor,
}: RowComponentProps<ListViewRowProps<T>>) => {
  const renderItem = renderedItems[index] as RenderItem<T>;

  if (renderItem.type === 'section') {
    return (
      <SectionHeader {...ariaAttributes} style={style}>
        <ApTypography variant={FontVariantToken.fontSizeS} color="var(--uix-canvas-foreground-emp)">
          {renderItem.sectionName}
        </ApTypography>
      </SectionHeader>
    );
  }

  const item = renderItem.item;
  const bgColor = getItemColor ? getItemColor(item) : 'color' in item ? item.color : undefined;

  return (
    <ListItemButton
      {...ariaAttributes}
      onClick={() => onItemClick(item)}
      style={{ ...style, padding: 0, paddingRight: '4px', height: '32px' }}
      onHoverStart={() => onItemHover?.(item)}
      className={isLoading ? 'loading' : ''}
      disabled={isLoading}
    >
      <IconContainer bgColor={bgColor} color="var(--uix-canvas-foreground-emp)">
        {item.icon?.url && (
          <img src={item.icon?.url} alt={item.name} style={{ width: 24, height: 24 }} />
        )}
        {item.icon?.name && (
          <ApIcon name={item.icon?.name} size="24px" color="var(--uix-canvas-foreground-de-emp)" />
        )}
        {item.icon?.Component && <item.icon.Component />}
      </IconContainer>
      <Column flex={1} overflow="hidden">
        <ApTypography
          variant={FontVariantToken.fontSizeS}
          className="list-view-item-name"
          color="var(--uix-canvas-foreground-emp)"
        >
          {item.name}
        </ApTypography>
        {item.description && (
          <ApTypography
            variant={FontVariantToken.fontSizeXs}
            className="list-view-item-name"
            color="var(--uix-canvas-foreground-de-emp)"
          >
            {item.description}
          </ApTypography>
        )}
      </Column>
      {!!item.children && (
        <ApIcon
          name="chevron_right"
          variant="outlined"
          size="20px"
          color="var(--uix-canvas-foreground-de-emp)"
        />
      )}
    </ListItemButton>
  );
};

interface ListViewProps<T extends ListItem> {
  items: T[];
  onItemClick: (item: T) => void;
  onItemHover?: (item: T) => void;
  getItemColor?: (item: T) => string | undefined;
  emptyStateMessage?: string;
  emptyStateIcon?: string;
  isLoading?: boolean;
  enableSections?: boolean;
}

export const ListView = <T extends ListItem>({
  items,
  onItemClick,
  getItemColor,
  onItemHover,
  emptyStateMessage = 'No items found',
  emptyStateIcon = 'search_off',
  isLoading = false,
  enableSections = true,
}: ListViewProps<T>) => {
  const renderedItems = useMemo<RenderItem<T>[]>(() => {
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
  }, [items, enableSections]);

  // Only show skeleton loaders when loading and no items exist
  if (isLoading && items.length === 0) {
    return (
      <Column gap={8}>
        {[...Array(3)].map((_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static array
          <ApSkeleton variant="rectangle" style={{ height: '32px', width: '100%' }} key={index} />
        ))}
      </Column>
    );
  }

  // Show empty state if no items and explicitly requested
  if (items.length === 0) {
    return (
      <Column align="center" justify="center" flex={1} gap={10} style={{ minHeight: '250px' }}>
        <ApIcon name={emptyStateIcon} size="48px" color="var(--uix-canvas-foreground-de-emp)" />
        <ApTypography
          variant={FontVariantToken.fontSizeS}
          color="var(--uix-canvas-foreground-de-emp)"
        >
          {emptyStateMessage}
        </ApTypography>
      </Column>
    );
  }

  return (
    <StyledList
      rowProps={{ renderedItems, isLoading, onItemClick, getItemColor, onItemHover }}
      rowComponent={ListViewRow}
      rowCount={renderedItems.length}
      rowHeight={40}
      overscanCount={20}
    />
  );
};
