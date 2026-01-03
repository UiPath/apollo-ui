import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import { Divider, ListItemText, Menu, MenuItem } from '@mui/material';
import * as token from '@uipath/apollo-core';
import { FontVariantToken } from '@uipath/apollo-core';
import React, { useCallback, useState } from 'react';
import { ApTypography } from '../ap-typography';
import type { ApMenuOrigin, ApMenuProps, IMenuItem } from './ApMenu.types';
import { debugItems } from './constants';

const anchorOriginDefault: ApMenuOrigin = {
  vertical: 'bottom',
  horizontal: 'left',
};

const transformOriginDefault: ApMenuOrigin = {
  vertical: 'top',
  horizontal: 'left',
};

export function ApMenu(props: Readonly<ApMenuProps>) {
  const {
    menuItems,
    onClose,
    anchorEl,
    maxHeight,
    width = 246,
    dontUseInternalOnlyDebugMode,
    anchorOrigin = anchorOriginDefault,
    transformOrigin = transformOriginDefault,
  } = props;
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());
  const [submenuAnchors, setSubmenuAnchors] = useState<Record<string, HTMLElement | null>>({});

  const handleMenuToggle = useCallback(
    (title: string, anchor?: HTMLElement) => {
      setOpenMenus((prev) => {
        const newOpenMenus = new Set(prev);
        if (newOpenMenus.has(title)) {
          newOpenMenus.delete(title);
          if (anchor) {
            setSubmenuAnchors((prevAnchors) => ({
              ...prevAnchors,
              [title]: null,
            }));
          }
        } else {
          newOpenMenus.add(title);
          if (anchor) {
            setSubmenuAnchors((prevAnchors) => ({
              ...prevAnchors,
              [title]: anchor,
            }));
          }
        }
        return newOpenMenus;
      });
    },
    [setOpenMenus, setSubmenuAnchors]
  );

  const renderSubMenu = useCallback(
    (item: IMenuItem) => {
      const anchor = submenuAnchors[item.title ?? ''];
      if (!item.subItems || !anchor) {
        return null;
      }

      return (
        <Menu
          anchorEl={anchor}
          open={openMenus.has(item.title ?? '')}
          onClose={() => handleMenuToggle(item.title ?? '')}
          slotProps={{
            paper: {
              style: {
                maxHeight,
                width,
                marginLeft: width,
                marginTop: -32,
              },
            },
          }}
        >
          {item.subItems.map((subItem, index) => (
            <React.Fragment key={index}>
              <MenuItem
                onClick={
                  subItem.subItems
                    ? (event) => {
                        event.stopPropagation();
                        handleMenuToggle(subItem.title ?? '', event.currentTarget);
                      }
                    : subItem.onClick
                }
                disabled={subItem.disabled}
                sx={{ minHeight: subItem.subtitle ? '64px !important' : '32px !important' }}
              >
                {subItem.startIcon}
                <ListItemText
                  primary={
                    <ApTypography
                      variant={FontVariantToken.fontSizeM}
                      color="var(--color-foreground)"
                      style={subItem.subtitle ? { marginBottom: 4 } : undefined}
                    >
                      {subItem.title}
                    </ApTypography>
                  }
                  secondary={
                    subItem.subtitle ? (
                      <ApTypography
                        variant={FontVariantToken.fontSizeS}
                        color="var(--color-foreground-de-emp)"
                      >
                        {subItem.subtitle}
                      </ApTypography>
                    ) : undefined
                  }
                />
                {subItem.subItems && (
                  <ArrowRightIcon
                    sx={{
                      marginLeft: token.Padding.PadS,
                      width: 16,
                    }}
                  />
                )}
              </MenuItem>
              {subItem.subItems && renderSubMenu(subItem)}
            </React.Fragment>
          ))}
        </Menu>
      );
    },
    [handleMenuToggle, maxHeight, openMenus, submenuAnchors, width]
  );

  return (
    <Menu
      anchorEl={anchorEl}
      open={props.isOpen}
      onClose={onClose}
      slotProps={{
        paper: {
          style: {
            maxHeight,
            width,
          },
        },
      }}
      anchorOrigin={anchorOrigin}
      transformOrigin={transformOrigin}
    >
      {(dontUseInternalOnlyDebugMode ? debugItems : menuItems).map((item, index) => {
        if (item.variant === 'section') {
          return (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                paddingLeft: token.Padding.PadXxxl,
                paddingRight: token.Padding.PadL,
                height: '32px',
              }}
            >
              <ApTypography variant={FontVariantToken.fontSizeMBold}>{item.title}</ApTypography>
            </div>
          );
        }

        if (item.variant === 'separator') {
          return (
            <Divider
              key={index}
              sx={{
                marginLeft: token.Padding.PadL,
                marginRight: token.Padding.PadL,
              }}
            />
          );
        }

        const hasSubItems = item.subItems && item.subItems.length > 0;

        return (
          <React.Fragment key={index}>
            <MenuItem
              tabIndex={0}
              sx={{
                display: 'flex',
                alignItems: 'center',
                paddingLeft: token.Padding.PadXxxl,
                paddingRight: token.Padding.PadL,
                minHeight: item.subtitle ? '64px !important' : '32px !important',
                height: '32px',
                ...(item.isSelected && {
                  backgroundColor: 'var(--color-background-selected) !important',
                  boxShadow: 'inset 4px 0px 0px var(--color-selection-indicator)',
                }),
              }}
              onClick={(event) => {
                if (item.onClick) {
                  item.onClick();
                }
                if (item.subItems) {
                  handleMenuToggle(item.title ?? '', event.currentTarget);
                }
              }}
              disabled={item.disabled}
            >
              {item.startIcon && (
                <span
                  style={{
                    marginRight: token.Padding.PadL,
                    display: 'flex',
                  }}
                >
                  {item.startIcon}
                </span>
              )}
              <ListItemText
                primary={
                  <ApTypography
                    variant={FontVariantToken.fontSizeM}
                    color="var(--color-foreground)"
                    style={item.subtitle ? { marginBottom: 4 } : undefined}
                  >
                    {item.title}
                  </ApTypography>
                }
                secondary={
                  item.subtitle ? (
                    <ApTypography
                      variant={FontVariantToken.fontSizeS}
                      color="var(--color-foreground-de-emp)"
                    >
                      {item.subtitle}
                    </ApTypography>
                  ) : undefined
                }
              />
              {item.endIcon}
              {hasSubItems && (
                <ArrowRightIcon
                  sx={{
                    marginLeft: token.Padding.PadS,
                    width: 16,
                  }}
                />
              )}
            </MenuItem>
            {hasSubItems && renderSubMenu(item)}
          </React.Fragment>
        );
      })}
    </Menu>
  );
}
