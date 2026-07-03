import AppsRoundedIcon from '@mui/icons-material/AppsRounded';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import { Colors } from '@uipath/apollo-core';
import React from 'react';
import { useSafeLingui } from '../../../../i18n';

/**
 * A single folder the picker can scope to. `id` is opaque to the
 * picker — the host re-fetches Discovery with whatever it means.
 */
export interface FolderSwitcherFolder {
  id: string;
  label: string;
}

export interface FolderSwitcherProps {
  /** Real folders the user can scope to. */
  folders: readonly FolderSwitcherFolder[];
  /**
   * Current folder id. Pass `null` for the "All folders" sentinel
   * (no `X-UiPath-FolderKey` header on the Discovery request).
   */
  value: string | null;
  onChange: (next: string | null) => void;
  /** Label for the "All folders" sentinel. Default: `'All folders'`. */
  allFoldersLabel?: string;
  /**
   * Render the "All folders" sentinel. Default: `true`. Set to `false`
   * when the host requires the picker to be scoped to a specific
   * folder (no tenant-wide BYO view).
   */
  showAllFolders?: boolean;
}

/**
 * Toolbar folder switcher. Renders as a pill with a grid/folder
 * indicator + label + chevron. Click opens a Popper-anchored menu
 * with "All folders" + per-folder items.
 *
 * Built on Popper (not MUI Select/Menu) because the parent
 * `<PickerPopup>` is itself a Popper — MUI's Menu/Popover absolute
 * positioning misbehaves when `disablePortal` plants a menu inside
 * another Popper-positioned container. Popper handles this correctly
 * because it re-runs placement on every open.
 */
export const FolderSwitcher: React.FC<FolderSwitcherProps> = ({
  folders,
  value,
  onChange,
  allFoldersLabel,
  showAllFolders = true,
}) => {
  const { _ } = useSafeLingui();
  const resolvedAllFoldersLabel =
    allFoldersLabel ??
    _({
      id: 'modelPicker.folderSwitcher.allFolders',
      message: 'All folders',
    });
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
  const open = !!anchorEl;
  const current = folders.find((f) => f.id === value);
  const isAll = value == null;

  return (
    <>
      <ButtonBase
        onClick={(e) => setAnchorEl(open ? null : e.currentTarget)}
        focusRipple
        aria-haspopup="listbox"
        aria-expanded={open}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          fontSize: 13,
          fontWeight: 600,
          lineHeight: 1.2,
          color: `var(--color-primary, ${Colors.ColorBlue500})`,
          backgroundColor: `var(--color-background-raised, ${Colors.ColorWhite})`,
          border: '1px solid',
          borderColor: `var(--color-border-de-emp, ${Colors.ColorGray300})`,
          borderRadius: '8px',
          px: 1.25,
          py: 0.875,
          '&:hover': {
            backgroundColor: `var(--color-background-hover, rgba(82, 96, 105, 0.078))`,
          },
        }}
      >
        {isAll ? (
          <AppsRoundedIcon sx={{ fontSize: 16, color: 'inherit' }} />
        ) : (
          <FolderOutlinedIcon sx={{ fontSize: 16, color: 'inherit' }} />
        )}
        <Box component="span" sx={{ whiteSpace: 'nowrap' }}>
          {isAll ? resolvedAllFoldersLabel : (current?.label ?? resolvedAllFoldersLabel)}
        </Box>
        <KeyboardArrowDownIcon
          sx={{
            fontSize: 16,
            color: `var(--color-foreground-de-emp, ${Colors.ColorGray550})`,
            transition: 'transform 150ms',
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
          }}
        />
      </ButtonBase>
      <Popper
        anchorEl={anchorEl}
        open={open}
        placement="bottom-start"
        disablePortal
        modifiers={[{ name: 'offset', options: { offset: [0, 4] } }]}
        style={{ zIndex: 10 }}
      >
        <ClickAwayListener onClickAway={() => setAnchorEl(null)}>
          <Paper
            elevation={8}
            sx={{
              minWidth: 200,
              borderRadius: '9px',
              border: '1px solid',
              borderColor: `var(--color-border-de-emp, ${Colors.ColorGray300})`,
              backgroundColor: `var(--color-background-raised, ${Colors.ColorWhite})`,
              boxShadow: '0 12px 32px rgba(16, 24, 40, 0.18), 0 2px 6px rgba(16, 24, 40, 0.06)',
            }}
          >
            <MenuList dense disablePadding sx={{ p: 0.5 }}>
              {showAllFolders && (
                <>
                  <MenuItem
                    key="__all"
                    selected={isAll}
                    onClick={() => {
                      onChange(null);
                      setAnchorEl(null);
                    }}
                    sx={{
                      fontSize: 13,
                      gap: 1,
                      py: 0.875,
                      borderRadius: '7px',
                    }}
                  >
                    <AppsRoundedIcon
                      sx={{
                        fontSize: 16,
                        color: `var(--color-foreground-de-emp, ${Colors.ColorGray550})`,
                      }}
                    />
                    {resolvedAllFoldersLabel}
                  </MenuItem>
                  <Divider sx={{ my: 0.25 }} />
                </>
              )}
              {folders.map((f) => (
                <MenuItem
                  key={f.id}
                  selected={value === f.id}
                  onClick={() => {
                    onChange(f.id);
                    setAnchorEl(null);
                  }}
                  sx={{ fontSize: 13, gap: 1, py: 0.875, borderRadius: '7px' }}
                >
                  <FolderOutlinedIcon
                    sx={{
                      fontSize: 16,
                      color: `var(--color-foreground-de-emp, ${Colors.ColorGray550})`,
                    }}
                  />
                  {f.label}
                </MenuItem>
              ))}
            </MenuList>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </>
  );
};
