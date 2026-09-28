import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { RichTreeView, TreeItem } from '@mui/x-tree-view';
import { useTreeItemModel, useTreeItemUtils } from '@mui/x-tree-view/hooks';
import token, { FontVariantToken } from '@uipath/apollo-core';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { ApTypography } from '../ap-typography';
import type { ApTreeItemProps, ApTreeViewItem, ApTreeViewProps } from './ApTreeView.types';
import { deepFind, recursivelyExpand } from './utils';

const ICON_SIZE = parseInt(token.Spacing.SpacingM, 10);
const CHEVRON_ICON_SIZE = ICON_SIZE;
const ICON_GAP = parseInt(token.Spacing.SpacingS, 10);

interface StyledTreeItemProps {
  levelPadding: number;
  disableExpandCollapse?: boolean;
}

const StyledTreeItem = styled(TreeItem, {
  shouldForwardProp: (prop) => prop !== 'levelPadding' && prop !== 'disableExpandCollapse',
})<StyledTreeItemProps>(({ disableExpandCollapse }) => ({
  '.MuiTreeItem-content': {
    position: 'relative',
    color: 'var(--color-foreground)',
    borderRadius: 0,
    height: token.Spacing.SpacingXl,
    '&.Mui-selected': {
      backgroundColor: 'var(--color-background-selected)',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        backgroundColor: 'var(--color-selection-indicator)',
        width: token.Spacing.SpacingXs,
      },
      '&:hover': {
        backgroundColor: 'var(--color-background-selected)',
      },
    },
    '&:hover:not(.Mui-disabled)': {
      backgroundColor: 'var(--color-background-hover)',
    },

    '.MuiTreeItem-iconContainer': {
      display: disableExpandCollapse ? 'none' : 'flex',
      width: `${ICON_SIZE}px`,
      height: `${ICON_SIZE}px`,
      '& > svg': {
        fontSize: `${ICON_SIZE}px !important`,
      },
    },
  },

  '.MuiCollapse-root': {
    paddingLeft: 0,
    '.MuiTreeItem-content': {
      paddingLeft: 'var(--ap-tree-level-padding) !important',
    },
  },

  '&:focus-visible > .MuiTreeItem-content': {
    zIndex: 1,
    outline: `${token.Border.BorderThickS} solid var(--color-focus-indicator)`,
  },
}));

type ApTreeItemParentContextType = {
  level: number;
  levelPadding: number;
  hasIcon: boolean;
};

const ApTreeItemParentContext = createContext<ApTreeItemParentContextType>({
  level: 0,
  hasIcon: false,
  levelPadding: 0,
});

/**
 * Individual tree item component
 */
export const ApTreeItem: React.FC<ApTreeItemProps> = ({
  itemId,
  children,
  disableExpandCollapse,
  showSelectedChevron,
}) => {
  const item = useTreeItemModel<ApTreeViewItem>(itemId);
  const { status, interactions } = useTreeItemUtils({ itemId, children });
  const parentContext = useContext(ApTreeItemParentContext);

  const {
    id = itemId,
    title = '',
    description,
    icon,
    iconColor,
    disabled,
    children: descendants,
    additionalInfo,
    titleColor,
  } = item || {};

  const canExpand = status.expandable;
  const isItemExpanded = status.expanded;
  const isItemSelected = status.selected;
  const canSelect = !status.disabled;
  const hasChildren = !!descendants?.length;

  const currentItemContext = useMemo(() => {
    const level = parentContext.level + 1;
    return {
      level,
      levelPadding:
        parentContext.levelPadding +
        (level > 1 ? CHEVRON_ICON_SIZE + ICON_SIZE : 0) -
        (hasChildren ? 0 : CHEVRON_ICON_SIZE),
      hasIcon: Boolean(icon),
    };
  }, [parentContext, icon, hasChildren]);

  const { levelPadding } = currentItemContext;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      (e as any).defaultMuiPrevented = true;

      if (e.currentTarget !== e.target) {
        return;
      }

      if (e.key === ' ' && canSelect) {
        e.preventDefault();
        interactions.handleSelection(e as any);
      } else if (e.key === 'Enter') {
        if (canExpand) {
          interactions.handleExpansion(e as any);
          e.preventDefault();
        } else if (canSelect) {
          interactions.handleSelection(e as any);
          e.preventDefault();
        }
      } else if (e.key === 'ArrowRight') {
        if (!isItemExpanded) {
          interactions.handleExpansion(e as any);
        }
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        if (isItemExpanded) {
          interactions.handleExpansion(e as any);
        }
        e.preventDefault();
      }
    },
    [canSelect, canExpand, interactions, isItemExpanded]
  );

  const label = (
    <Tooltip title={description || ''} arrow>
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: `${ICON_GAP}px`,
          }}
        >
          {icon && (
            <Box
              component="span"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                width: `${ICON_SIZE}px`,
                height: `${ICON_SIZE}px`,
                color: iconColor || 'inherit',
              }}
            >
              {icon}
            </Box>
          )}
          <ApTypography
            variant={FontVariantToken.fontSizeM}
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: titleColor || undefined,
            }}
          >
            {title}
          </ApTypography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: token.Spacing.SpacingXs,
          }}
        >
          {additionalInfo && (
            <ApTypography
              variant={FontVariantToken.fontSizeM}
              style={{
                color: 'var(--color-foreground-de-emp)',
                whiteSpace: 'nowrap',
              }}
            >
              {additionalInfo}
            </ApTypography>
          )}
          {showSelectedChevron && isItemSelected && (
            <ChevronRightIcon
              sx={{
                fontSize: ICON_SIZE,
                color: 'var(--color-foreground-de-emp)',
              }}
            />
          )}
        </Box>
      </Box>
    </Tooltip>
  );

  return (
    <ApTreeItemParentContext.Provider value={currentItemContext}>
      <StyledTreeItem
        key={id}
        levelPadding={levelPadding}
        data-is-focusable={!disabled}
        style={
          {
            '--ap-tree-level-padding': `${levelPadding}px`,
          } as React.CSSProperties
        }
        onKeyDown={handleKeyDown}
        itemId={id}
        label={label}
        disableExpandCollapse={disableExpandCollapse}
        disabled={disabled}
        data-test={`ap-tree-item-${id}`}
        role="treeitem"
      >
        {children}
      </StyledTreeItem>
    </ApTreeItemParentContext.Provider>
  );
};

const getItemLabel = (item: ApTreeViewItem) => item.title;
const isItemDisabled = (item: ApTreeViewItem) => !!item.disabled;

/**
 * ApTreeView - Tree view component with Apollo design system styling
 */
export const ApTreeView = React.forwardRef<HTMLDivElement, ApTreeViewProps>(
  (
    {
      items = [],
      selectedItemId,
      expanded,
      disableExpandCollapse,
      showSelectedChevron,
      onSelectedItemsChange,
      useApIcon = false,
      ...restProps
    },
    ref
  ) => {
    const [expandedItems, setExpandedItems] = useState<string[]>(() => {
      return (expanded && typeof expanded === 'boolean') || disableExpandCollapse
        ? recursivelyExpand(items)
        : [...(expanded || [])];
    });

    const handleOnSelectedItemsChange = useCallback(
      (_: React.SyntheticEvent | null, itemId: string | null) => {
        if (itemId == null) {
          onSelectedItemsChange?.(undefined);
          return;
        }

        const selectedItemResult = deepFind(items, (item) => itemId === item.id);
        if (selectedItemResult) {
          onSelectedItemsChange?.(selectedItemResult.id);
        }
      },
      [items, onSelectedItemsChange]
    );

    const onExpandedItemsChange = useCallback(
      (_e: React.SyntheticEvent | null, itemIds: string[]) => {
        if (disableExpandCollapse) {
          return;
        }
        setExpandedItems(itemIds);
      },
      [disableExpandCollapse]
    );

    return (
      <div ref={ref} role="tree" {...restProps}>
        <RichTreeView<ApTreeViewItem>
          items={items}
          selectedItems={selectedItemId ?? null}
          expandedItems={expandedItems}
          getItemLabel={getItemLabel}
          onSelectedItemsChange={handleOnSelectedItemsChange}
          onExpandedItemsChange={onExpandedItemsChange}
          isItemDisabled={isItemDisabled}
          slots={{
            item: ApTreeItem as any,
          }}
          slotProps={{
            item: {
              disableExpandCollapse,
              showSelectedChevron,
              useApIcon,
            } as any,
          }}
        />
      </div>
    );
  }
);

ApTreeView.displayName = 'ApTreeView';
