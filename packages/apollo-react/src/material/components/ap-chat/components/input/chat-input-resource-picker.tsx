import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import CircularProgress from '@mui/material/CircularProgress';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { styled } from '@mui/material/styles';
import token, { FontVariantToken } from '@uipath/apollo-core';
import { ApButton, ApIcon, ApTypography } from '@uipath/apollo-react/material';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { RowComponentProps } from 'react-window';
import { List, type ListImperativeAPI, useListRef } from 'react-window';
import { ApSkeleton } from '../../../ap-skeleton';
import { useChatState } from '../../providers/chat-state-provider';
import {
  isResourceSelector,
  useAutopilotChatResourcePicker,
} from '../../providers/resource-picker-provider';
import {
  type AutopilotChatResourceItem,
  CHAT_RESOURCE_PICKER_ITEM_HEIGHT,
  CHAT_RESOURCE_PICKER_LOAD_MORE_THRESHOLD,
  CHAT_RESOURCE_PICKER_MAX_SKELETON_COUNT,
  CHAT_RESOURCE_PICKER_MENU_MAX_HEIGHT,
  CHAT_RESOURCE_PICKER_MENU_WIDTH,
  CHAT_RESOURCE_PICKER_MIN_SKELETON_COUNT,
  CHAT_RESOURCE_PICKER_TOOLTIP_ENTER_DELAY,
} from '../../service';
import { AutopilotChatIconButton } from '../common/icon-button';
import { AutopilotChatTooltip } from '../common/tooltip';

const ellipsisStyle = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
} as const;

const StyledMenuItem = styled(MenuItem)({
  display: 'flex',
  alignItems: 'center',
  gap: token.Spacing.SpacingXs,
  justifyContent: 'space-between',
});

const ResourceItemContent = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: token.Spacing.SpacingXs,
  flex: 1,
  minWidth: 0,
});

const ErrorContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: token.Spacing.SpacingS,
  padding: token.Padding.PadXxxl,
  color: theme.palette.semantic.colorErrorText,
}));

const EmptyContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: `${token.Padding.PadXxl} ${token.Padding.PadXxxl}`,
  color: theme.palette.semantic.colorForegroundDeEmp,
}));

const DrillDownHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: token.Spacing.SpacingMicro,
  padding: `${token.Padding.PadXs} ${token.Padding.PadXxxl} ${token.Padding.PadXs} ${token.Padding.PadXxl}`,
  backgroundColor: theme.palette.semantic.colorBackgroundSecondary,
}));

const SkeletonItem = styled(StyledMenuItem)({
  pointerEvents: 'none',
});

const StyledResourceList = styled(List)({
  '&::-webkit-scrollbar': { width: '6px' },
  '&::-webkit-scrollbar-track': { background: 'transparent' },
  '&::-webkit-scrollbar-thumb': {
    background: 'var(--color-border-de-emp)',
    borderRadius: '3px',
  },
}) as typeof List;

const loaderRowStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center' } as const;

const preventDefaultMouseDown = (e: React.MouseEvent) => e.preventDefault();

const MENU_SLOT_PROPS = {
  paper: {
    sx: {
      width: CHAT_RESOURCE_PICKER_MENU_WIDTH,
      maxHeight: CHAT_RESOURCE_PICKER_MENU_MAX_HEIGHT,
      overflowY: 'hidden' as const,
      display: 'flex',
      flexDirection: 'column' as const,
    },
  },
};

type NavigationMode = 'keyboard' | 'pointer' | 'none';

interface VirtualizedResourceRowProps {
  items: AutopilotChatResourceItem[];
  selectedIndex: number;
  navigationMode: NavigationMode;
  handleItemClick: (item: AutopilotChatResourceItem) => void;
  onMouseEnterItem: (index: number) => void;
  tooltipPlacement: 'left' | 'right' | 'top' | 'bottom';
  fontToken: FontVariantToken;
}

const VirtualizedResourceRow = ({
  index,
  style,
  ariaAttributes,
  items,
  selectedIndex,
  navigationMode,
  handleItemClick,
  onMouseEnterItem,
  tooltipPlacement,
  fontToken,
}: RowComponentProps<VirtualizedResourceRowProps>) => {
  if (index >= items.length) {
    return (
      <div style={{ ...style, ...loaderRowStyle }}>
        <CircularProgress size={20} />
      </div>
    );
  }

  const item = items[index]!;
  const isSelected = index === selectedIndex;
  const isCategory = isResourceSelector(item);
  const tooltipContent = item.tooltip;
  const isKeyboardSelected = isSelected && navigationMode === 'keyboard';
  const menuItem = (
    <StyledMenuItem
      id={`resource-item-${item.id}`}
      selected={isSelected}
      onClick={() => handleItemClick(item)}
      onMouseEnter={() => onMouseEnterItem(index)}
      style={style}
      {...ariaAttributes}
    >
      <ResourceItemContent>
        {item.icon && <ApIcon variant="outlined" name={item.icon} size={token.Icon.IconXs} />}
        <ApTypography variant={fontToken} style={ellipsisStyle}>
          {item.displayName}
        </ApTypography>
      </ResourceItemContent>
      {isCategory && <ApIcon variant="outlined" name="chevron_right" size={token.Icon.IconXs} />}
    </StyledMenuItem>
  );

  if (!tooltipContent) {
    return menuItem;
  }

  return (
    <AutopilotChatTooltip
      title={
        <ApTypography
          color={'var(--color-foreground-inverse)'}
          variant={FontVariantToken.fontSizeS}
        >
          {tooltipContent}
        </ApTypography>
      }
      placement={tooltipPlacement}
      open={isKeyboardSelected ? true : undefined}
      enterDelay={isKeyboardSelected ? 0 : CHAT_RESOURCE_PICKER_TOOLTIP_ENTER_DELAY}
      enterNextDelay={isKeyboardSelected ? 0 : CHAT_RESOURCE_PICKER_TOOLTIP_ENTER_DELAY}
    >
      {menuItem}
    </AutopilotChatTooltip>
  );
};

interface MenuContentProps {
  virtualListRef: React.RefObject<ListImperativeAPI | null>;
  selectedIndex: number;
  navigationMode: NavigationMode;
  onMouseEnterItem: (index: number) => void;
  onItemClick: (item: AutopilotChatResourceItem) => void;
}

const MenuContent = React.memo(function MenuContent({
  virtualListRef,
  selectedIndex,
  navigationMode,
  onMouseEnterItem,
  onItemClick,
}: MenuContentProps) {
  const {
    displayedItems: items,
    drillDown,
    query,
    loading,
    loadingMore,
    searchInProgress,
    hasMore,
    error,
    previousDisplayCount,
    goBackOrClose,
    retryLoad,
    loadMore,
  } = useAutopilotChatResourcePicker();
  const { theming, spacing } = useChatState();
  const { _ } = useLingui();

  const drillDownHeaderRef = useRef<HTMLDivElement>(null);
  const [drillDownHeaderHeight, setDrillDownHeaderHeight] = useState(0);

  useLayoutEffect(() => {
    if (!drillDown) {
      setDrillDownHeaderHeight(0);
      return;
    }
    setDrillDownHeaderHeight(drillDownHeaderRef.current?.offsetHeight ?? 0);
  }, [drillDown]);

  const handleRowsRendered = useCallback(
    (
      visibleRows: { startIndex: number; stopIndex: number },
      _allRows: { startIndex: number; stopIndex: number }
    ) => {
      if (!hasMore || loadingMore) return;
      if (visibleRows.stopIndex >= items.length - CHAT_RESOURCE_PICKER_LOAD_MORE_THRESHOLD) {
        loadMore();
      }
    },
    [items.length, hasMore, loadingMore, loadMore]
  );

  const tooltipPlacement = theming?.chatMenu?.groupItemTooltipPlacement ?? 'left';
  const isLoadingState = loading || searchInProgress;

  const skeletonElements = useMemo(() => {
    const skeletonCount = Math.min(
      Math.max(previousDisplayCount, CHAT_RESOURCE_PICKER_MIN_SKELETON_COUNT),
      CHAT_RESOURCE_PICKER_MAX_SKELETON_COUNT
    );
    return Array.from({ length: skeletonCount }).map((_, index) => (
      <SkeletonItem key={`skeleton-${index}`} disabled>
        <ApSkeleton />
      </SkeletonItem>
    ));
  }, [previousDisplayCount]);

  const rowCount = items.length + (loadingMore ? 1 : 0);
  const listHeight = Math.min(
    CHAT_RESOURCE_PICKER_MENU_MAX_HEIGHT - drillDownHeaderHeight,
    rowCount * CHAT_RESOURCE_PICKER_ITEM_HEIGHT
  );

  const rowProps = useMemo(
    () => ({
      items,
      selectedIndex,
      navigationMode,
      handleItemClick: onItemClick,
      onMouseEnterItem,
      tooltipPlacement,
      fontToken: spacing.primaryFontToken,
    }),
    [
      items,
      selectedIndex,
      navigationMode,
      onItemClick,
      onMouseEnterItem,
      tooltipPlacement,
      spacing.primaryFontToken,
    ]
  );

  const drillDownHeader = drillDown ? (
    <DrillDownHeader ref={drillDownHeaderRef}>
      <AutopilotChatIconButton
        size="small"
        onClick={goBackOrClose}
        aria-label={_(msg({ id: 'autopilot-chat.resource-picker.back', message: 'Go back' }))}
      >
        <ApIcon variant="outlined" name="arrow_back" size={token.Icon.IconXs} />
      </AutopilotChatIconButton>
      <ApTypography variant={spacing.primaryBoldFontToken} style={ellipsisStyle}>
        {drillDown.category.displayName}
      </ApTypography>
    </DrillDownHeader>
  ) : null;

  if (isLoadingState) {
    return (
      <>
        {drillDownHeader}
        {skeletonElements}
      </>
    );
  }

  if (error) {
    return (
      <>
        {drillDownHeader}
        <ErrorContainer>
          <ApTypography variant={FontVariantToken.fontSizeS}>{error}</ApTypography>
          <ApButton variant="text" size="small" onClick={retryLoad} label="retry">
            {_(msg({ id: 'autopilot-chat.resource-picker.retry', message: 'Retry' }))}
          </ApButton>
        </ErrorContainer>
      </>
    );
  }

  if (items.length === 0) {
    const emptyMessage = query.trim()
      ? _(
          msg({
            id: 'autopilot-chat.resource-picker.no-results',
            message: 'No matching resources',
          })
        )
      : _(msg({ id: 'autopilot-chat.resource-picker.empty', message: 'No resources available' }));

    return (
      <>
        {drillDownHeader}
        <EmptyContainer>
          <ApTypography variant={FontVariantToken.fontSizeS}>{emptyMessage}</ApTypography>
        </EmptyContainer>
      </>
    );
  }

  return (
    <>
      {drillDownHeader}
      <StyledResourceList
        listRef={virtualListRef}
        rowProps={rowProps}
        rowComponent={VirtualizedResourceRow}
        rowCount={rowCount}
        rowHeight={CHAT_RESOURCE_PICKER_ITEM_HEIGHT}
        overscanCount={5}
        onRowsRendered={handleRowsRendered}
        style={{ height: listHeight }}
      />
    </>
  );
});

export interface ResourcePickerDropdownHandle {
  handleKeyDown: (event: KeyboardEvent) => boolean;
}

function ResourcePickerDropdownInner(
  _props: object,
  ref: React.ForwardedRef<ResourcePickerDropdownHandle>
) {
  const {
    isOpen,
    isOpenRef,
    anchorPosition,
    displayedItems: items,
    drillDown,
    query,
    handleItemClick,
    close,
    goBackOrClose,
  } = useAutopilotChatResourcePicker();
  const virtualListRef = useListRef(null);
  const { _ } = useLingui();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [navigationMode, setNavigationMode] = useState<NavigationMode>('none');

  const prevStateRef = useRef({
    query,
    drillDownId: drillDown?.category?.id,
  });

  useEffect(() => {
    const prev = prevStateRef.current;
    const currentDrillDownId = drillDown?.category?.id;

    if (prev.query !== query || prev.drillDownId !== currentDrillDownId) {
      setSelectedIndex(0);
      setNavigationMode('none');
    }
    prev.query = query;
    prev.drillDownId = currentDrillDownId;
  }, [query, drillDown]);

  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
      setNavigationMode('none');
    }
  }, [isOpen]);

  useEffect(() => {
    if (navigationMode === 'keyboard') {
      virtualListRef.current?.scrollToRow({
        index: selectedIndex,
        align: 'auto',
      });
    }
  }, [selectedIndex, navigationMode, virtualListRef]);

  const navigateUp = useCallback(() => {
    setSelectedIndex((prev) => Math.max(prev - 1, 0));
    setNavigationMode('keyboard');
  }, []);

  const navigateDown = useCallback(() => {
    setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1));
    setNavigationMode('keyboard');
  }, [items.length]);

  const handleMouseEnterItem = useCallback((index: number) => {
    setSelectedIndex(index);
    setNavigationMode('pointer');
  }, []);

  const selectItem = useCallback(() => {
    const selectedItem = items[selectedIndex];
    if (selectedItem) {
      handleItemClick(selectedItem);
    }
  }, [items, selectedIndex, handleItemClick]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: isOpenRef is a stable ref read synchronously at call time
  useImperativeHandle(
    ref,
    () => ({
      handleKeyDown: (event: KeyboardEvent): boolean => {
        if (!isOpenRef.current) return false;

        switch (event.key) {
          case 'ArrowDown':
            event.preventDefault();
            navigateDown();
            return true;
          case 'ArrowUp':
            event.preventDefault();
            navigateUp();
            return true;
          case 'Enter':
          case 'Tab':
            event.preventDefault();
            selectItem();
            return true;
          case 'Escape':
            event.preventDefault();
            drillDown ? goBackOrClose() : close();
            return true;
          default:
            return false;
        }
      },
    }),
    [navigateDown, navigateUp, selectItem, goBackOrClose, drillDown, close]
  );
  const handleMenuClose = useCallback(
    (_event: React.SyntheticEvent, reason: 'backdropClick' | 'escapeKeyDown') => {
      if (reason === 'escapeKeyDown' && drillDown) {
        goBackOrClose();
        return;
      }
      close();
    },
    [drillDown, goBackOrClose, close]
  );

  return (
    <Menu
      open={isOpen}
      anchorReference="anchorPosition"
      anchorPosition={anchorPosition ?? undefined}
      onClose={handleMenuClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
      transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      disableAutoFocus
      autoFocus={false}
      MenuListProps={{
        'aria-label': _(
          msg({ id: 'autopilot-chat.resource-picker.label', message: 'Resource picker' })
        ),
        dense: true,
        disableListWrap: true,
        onMouseDown: preventDefaultMouseDown,
      }}
      slotProps={MENU_SLOT_PROPS}
    >
      <MenuContent
        virtualListRef={virtualListRef}
        selectedIndex={selectedIndex}
        navigationMode={navigationMode}
        onMouseEnterItem={handleMouseEnterItem}
        onItemClick={handleItemClick}
      />
    </Menu>
  );
}

export const ResourcePickerDropdown = React.memo(forwardRef(ResourcePickerDropdownInner));
