import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { CircularProgress, Menu, MenuItem, Skeleton, styled } from '@mui/material';
import token, { FontVariantToken } from '@uipath/apollo-core';
import { ApButton, ApIcon, ApTypography } from '@uipath/apollo-react/material';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useChatState } from '../../providers/chat-state-provider';
import {
  isResourceSelector,
  useAutopilotChatResourcePicker,
} from '../../providers/resource-picker-provider';
import { type AutopilotChatResourceItem } from '../../service';
import { AutopilotChatTooltip } from '../common/tooltip';

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

const SCROLL_THRESHOLD = 50;
const SKELETON_COUNT = 7;

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
    handleItemClick,
    close,
    goBackOrClose,
    retryLoad,
    loadMore,
  } = useAutopilotChatResourcePicker();
  const { theming, spacing } = useChatState();
  const listRef = useRef<HTMLUListElement>(null);
  const { _ } = useLingui();

  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLUListElement>) => {
      if (!hasMore || loadingMore) return;

      const target = event.currentTarget;
      const nearBottom =
        target.scrollHeight - target.scrollTop - target.clientHeight < SCROLL_THRESHOLD;

      if (nearBottom) {
        loadMore();
      }
    },
    [hasMore, loadingMore, loadMore]
  );

  useEffect(() => {
    if (displayedItems.length > 0) {
      setSelectedIndex(0);
    }
  }, [displayedItems]);

  useEffect(() => {
    if (listRef.current && displayedItems.length > 0) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      selectedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, displayedItems.length]);

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
        if (!isOpen) return false;

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
    [isOpen, navigateDown, navigateUp, selectItem, goBackOrClose]
  );
  const tooltipPlacement = theming?.chatMenu?.groupItemTooltipPlacement ?? 'left';

  const renderItem = useCallback(
    (item: AutopilotChatResourceItem, index: number) => {
      const isCategory = isResourceSelector(item);
      const isSelected = index === selectedIndex;
      const tooltipContent = item.tooltip;

      const menuItem = (
        <StyledMenuItem key={item.id} selected={isSelected} onClick={() => handleItemClick(item)}>
          <ResourceItemContent>
            <ApIcon variant="outlined" name={item.icon} size={token.Icon.IconXs} />
            <ApTypography
              variant={spacing.primaryFontToken}
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item.displayName}
            </ApTypography>
          </ResourceItemContent>
          {isCategory && (
            <ApIcon variant="outlined" name="chevron_right" size={token.Icon.IconXs} />
          )}
        </StyledMenuItem>
      );

      if (!tooltipContent) {
        return menuItem;
      }

      return (
        <AutopilotChatTooltip
          key={item.id}
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
    },
    [selectedIndex, handleItemClick, tooltipPlacement, spacing.primaryFontToken]
  );

  function renderDrillDownHeader(): React.ReactNode {
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
        <ApTypography
          variant={spacing.primaryBoldFontToken}
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {drillDown.category.displayName}
        </ApTypography>
      </DrillDownHeader>
    );
  }

  function renderSkeletons(): React.ReactNode[] {
    return Array.from({ length: SKELETON_COUNT }).map((_, index) => (
      <SkeletonItem key={`skeleton-${index}`} disabled>
        <ResourceItemContent>
          <Skeleton variant="circular" width={24} height={24} />
          <Skeleton
            variant="rounded"
            width={`${50 + (index % 4) * 15}%`}
            height={20}
            sx={{ borderRadius: '4px' }}
          />
        </ResourceItemContent>
      </SkeletonItem>
    ));
  }

  const isLoadingState = loading || searchInProgress;

  function renderMenuContent(): React.ReactNode[] {
    const header = renderDrillDownHeader();

    if (isLoadingState) {
      return [header, ...renderSkeletons()];
    }

    if (error) {
      return [
        header,
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
        header,
        <EmptyContainer key="empty">
          <ApTypography variant={FontVariantToken.fontSizeS}>{emptyMessage}</ApTypography>
        </EmptyContainer>,
      ];
    }

    return [
      header,
      ...displayedItems.map((item, index) => renderItem(item, index)),
      loadingMore && (
        <LoadMoreContainer key="loading-more">
          <CircularProgress size={20} />
        </LoadMoreContainer>
      ),
    ];
  }

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
        onScroll: handleScroll,
        sx: isLoadingState ? { minHeight: 296, boxSizing: 'border-box' } : undefined,
      }}
      slotProps={{
        paper: {
          sx: {
            width: 360,
            maxHeight: 296,
            ...(isLoadingState && { minHeight: 296 }),
          },
        },
      }}
    >
      {renderMenuContent()}
    </Menu>
  );
}

export const ResourcePickerDropdown = React.memo(forwardRef(ResourcePickerDropdownInner));
