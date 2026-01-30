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
import { ApSkeleton } from '../../../ap-skeleton';
import { useChatState } from '../../providers/chat-state-provider';
import {
  isResourceSelector,
  useAutopilotChatResourcePicker,
} from '../../providers/resource-picker-provider';
import { MAX_SKELETON_COUNT, MIN_SKELETON_COUNT } from '../../providers/use-resource-picker-state';
import { type AutopilotChatResourceItem } from '../../service';
import { AutopilotChatTooltip } from '../common/tooltip';

const SCROLL_THRESHOLD = 50;
const MENU_ITEM_HEIGHT = 40;

const ellipsisStyle = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
} as const;

const skeletonStyle = { flex: 1, height: 20 } as const;

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
  padding: token.Spacing.SpacingM,
  color: theme.palette.semantic.colorErrorText,
}));

const EmptyContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: token.Spacing.SpacingM,
  minHeight: MIN_SKELETON_COUNT * MENU_ITEM_HEIGHT,
  color: theme.palette.semantic.colorForegroundDeEmp,
}));

const LoadMoreContainer = styled('div')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: token.Spacing.SpacingS,
});

const DrillDownHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  height: '28px',
  alignItems: 'center',
  gap: token.Spacing.SpacingXs,
  padding: `2px ${token.Spacing.SpacingBase}`,
  backgroundColor: theme.palette.semantic.colorBackgroundSecondary,
  cursor: 'pointer',
}));

const SkeletonItem = styled(StyledMenuItem)({
  pointerEvents: 'none',
});

interface ResourceMenuItemProps {
  item: AutopilotChatResourceItem;
  isSelected: boolean;
  onItemClick: (item: AutopilotChatResourceItem) => void;
  tooltipPlacement: 'left' | 'right' | 'top' | 'bottom';
  fontToken: FontVariantToken;
}

const ResourceMenuItem = React.memo(function ResourceMenuItem({
  item,
  isSelected,
  onItemClick,
  tooltipPlacement,
  fontToken,
}: ResourceMenuItemProps) {
  const isCategory = isResourceSelector(item);
  const tooltipContent = item.tooltip;

  const handleClick = useCallback(() => onItemClick(item), [onItemClick, item]);

  const menuItem = (
    <StyledMenuItem id={`resource-item-${item.id}`} selected={isSelected} onClick={handleClick}>
      <ResourceItemContent>
        <ApIcon variant="outlined" name={item.icon} size={token.Icon.IconXs} />
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
      open={isSelected ? true : undefined}
      enterDelay={isSelected ? 0 : 300}
      enterNextDelay={isSelected ? 0 : 300}
    >
      {menuItem}
    </AutopilotChatTooltip>
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
    anchorPosition,
    displayedItems,
    drillDown,
    query,
    loading,
    loadingMore,
    searchInProgress,
    hasMore,
    error,
    previousDisplayCount,
    handleItemClick,
    close,
    goBackOrClose,
    retryLoad,
    loadMore,
  } = useAutopilotChatResourcePicker();
  const { theming, spacing } = useChatState();
  const listRef = useRef<HTMLUListElement>(null);
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;
  const { _ } = useLingui();

  const [selectedIndex, setSelectedIndex] = useState(0);

  // Refs for stable scroll handler (avoids recreating callback on state changes)
  const scrollStateRef = useRef({
    hasMore,
    loadingMore,
    loadMore,
    scrollTop: 0,
    container: null as HTMLElement | null,
  });
  scrollStateRef.current.hasMore = hasMore;
  scrollStateRef.current.loadingMore = loadingMore;
  scrollStateRef.current.loadMore = loadMore;

  // Refs for tracking state changes
  const prevStateRef = useRef({
    query,
    drillDownId: drillDown?.category?.id,
    selectedIndex,
    loadingMore,
  });

  const handleScroll = useCallback((event: React.UIEvent<HTMLElement>) => {
    const target = event.currentTarget;
    const state = scrollStateRef.current;

    state.scrollTop = target.scrollTop;
    state.container = target;

    if (!state.hasMore || state.loadingMore) return;

    const nearBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight < SCROLL_THRESHOLD;
    if (nearBottom) {
      state.loadMore();
    }
  }, []);

  // Reset selection when query or category changes (not on pagination)
  useEffect(() => {
    const prev = prevStateRef.current;
    const currentDrillDownId = drillDown?.category?.id;

    if (prev.query !== query || prev.drillDownId !== currentDrillDownId) {
      setSelectedIndex(0);
    }
    prev.query = query;
    prev.drillDownId = currentDrillDownId;
  }, [query, drillDown]);

  // Scroll selected item into view only when selectedIndex changes (keyboard navigation)
  useEffect(() => {
    const prev = prevStateRef.current;
    if (prev.selectedIndex === selectedIndex) return;
    prev.selectedIndex = selectedIndex;

    const selectedItem = displayedItems[selectedIndex];
    if (listRef.current && selectedItem) {
      const selectedElement = listRef.current.querySelector(
        `#resource-item-${selectedItem.id}`
      ) as HTMLElement;
      selectedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, displayedItems]);

  // Restore scroll position after pagination completes
  useLayoutEffect(() => {
    const prev = prevStateRef.current;
    const wasLoadingMore = prev.loadingMore;
    prev.loadingMore = loadingMore;

    if (wasLoadingMore && !loadingMore) {
      const { scrollTop, container } = scrollStateRef.current;
      if (container && scrollTop > 0) {
        container.scrollTop = scrollTop;
      }
    }
  }, [loadingMore]);

  const navigateUp = useCallback(() => {
    setSelectedIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const navigateDown = useCallback(() => {
    setSelectedIndex((prev) => Math.min(prev + 1, displayedItems.length - 1));
  }, [displayedItems.length]);

  const selectItem = useCallback(() => {
    const selectedItem = displayedItems[selectedIndex];
    if (selectedItem) {
      handleItemClick(selectedItem);
    }
  }, [displayedItems, selectedIndex, handleItemClick]);

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
            goBackOrClose();
            return true;
          default:
            return false;
        }
      },
    }),
    [navigateDown, navigateUp, selectItem, goBackOrClose]
  );
  const tooltipPlacement = theming?.chatMenu?.groupItemTooltipPlacement ?? 'left';

  const skeletonElements = useMemo(() => {
    const skeletonCount = Math.min(
      Math.max(previousDisplayCount, MIN_SKELETON_COUNT),
      MAX_SKELETON_COUNT
    );
    return Array.from({ length: skeletonCount }).map((_, index) => (
      <SkeletonItem key={`skeleton-${index}`} disabled>
        <ApSkeleton style={skeletonStyle} />
      </SkeletonItem>
    ));
  }, [previousDisplayCount]);

  const menuSlotProps = useMemo(
    () => ({
      paper: {
        sx: {
          width: 360,
          maxHeight: 296,
          overflowY: 'auto',
        },
        onScroll: handleScroll,
      },
    }),
    [handleScroll]
  );

  const isLoadingState = loading || searchInProgress;

  const drillDownHeader = useMemo(() => {
    if (!drillDown) return null;

    return (
      <DrillDownHeader
        key="drilldown-header"
        onClick={goBackOrClose}
        role="button"
        tabIndex={0}
        aria-label={_(msg({ id: 'autopilot-chat.resource-picker.back', message: 'Go back' }))}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            goBackOrClose();
          }
        }}
      >
        <ApIcon variant="outlined" name="arrow_back" size={token.Icon.IconXs} />
        <ApTypography variant={spacing.primaryBoldFontToken} style={ellipsisStyle}>
          {drillDown.category.displayName}
        </ApTypography>
      </DrillDownHeader>
    );
  }, [drillDown, goBackOrClose, spacing.primaryBoldFontToken, _]);

  const menuContent = useMemo((): React.ReactNode[] => {
    if (isLoadingState) {
      return [drillDownHeader, ...skeletonElements];
    }

    if (error) {
      return [
        drillDownHeader,
        <ErrorContainer key="error">
          <ApTypography variant={FontVariantToken.fontSizeS}>{error}</ApTypography>
          <ApButton variant="text" size="small" onClick={retryLoad} label="retry">
            {_(msg({ id: 'autopilot-chat.resource-picker.retry', message: 'Retry' }))}
          </ApButton>
        </ErrorContainer>,
      ];
    }

    if (displayedItems.length === 0) {
      const emptyMessage = query.trim()
        ? _(
            msg({
              id: 'autopilot-chat.resource-picker.no-results',
              message: 'No matching resources',
            })
          )
        : _(msg({ id: 'autopilot-chat.resource-picker.empty', message: 'No resources available' }));

      return [
        drillDownHeader,
        <EmptyContainer key="empty">
          <ApTypography variant={FontVariantToken.fontSizeS}>{emptyMessage}</ApTypography>
        </EmptyContainer>,
      ];
    }

    return [
      drillDownHeader,
      ...displayedItems.map((item, index) => (
        <ResourceMenuItem
          key={item.id}
          item={item}
          isSelected={index === selectedIndex}
          onItemClick={handleItemClick}
          tooltipPlacement={tooltipPlacement}
          fontToken={spacing.primaryFontToken}
        />
      )),
      loadingMore && (
        <LoadMoreContainer key="loading-more">
          <CircularProgress size={20} />
        </LoadMoreContainer>
      ),
    ];
  }, [
    isLoadingState,
    drillDownHeader,
    skeletonElements,
    error,
    retryLoad,
    _,
    displayedItems,
    query,
    selectedIndex,
    handleItemClick,
    tooltipPlacement,
    spacing.primaryFontToken,
    loadingMore,
  ]);

  return (
    <Menu
      open={isOpen}
      anchorReference="anchorPosition"
      anchorPosition={anchorPosition ?? undefined}
      onClose={close}
      anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
      transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      disableAutoFocus
      autoFocus={false}
      MenuListProps={{
        'aria-label': _(
          msg({ id: 'autopilot-chat.resource-picker.label', message: 'Resource picker' })
        ),
        dense: true,
        ref: listRef,
      }}
      slotProps={menuSlotProps}
    >
      {menuContent}
    </Menu>
  );
}

export const ResourcePickerDropdown = React.memo(forwardRef(ResourcePickerDropdownInner));
