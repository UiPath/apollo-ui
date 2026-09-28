import type { MenuProps } from '@mui/material';
import type React from 'react';

export interface ApMenuOrigin {
  vertical: 'top' | 'center' | 'bottom' | number;
  horizontal: 'left' | 'center' | 'right' | number;
}

export interface IMenuItem {
  /**
   * Menu item title
   */
  title?: string;
  /**
   * Optional subtitle for the menu item
   */
  subtitle?: string;
  /**
   * Icon to display at the start of the menu item
   */
  startIcon?: React.ReactNode;
  /**
   * Icon to display at the end of the menu item
   */
  endIcon?: React.ReactNode;
  /**
   * Whether the menu item is disabled
   */
  disabled?: boolean;
  /**
   * Type of menu item
   */
  variant: 'section' | 'item' | 'separator' | 'submenu';
  /**
   * Whether the menu item is selected
   */
  isSelected?: boolean;
  /**
   * Sub-items for nested menu
   */
  subItems?: IMenuItem[];
  /**
   * Click handler for the menu item
   */
  onClick?: () => void;
}

export type ApMenuProps = React.PropsWithChildren<{
  /**
   * Array of menu items to display
   */
  menuItems: IMenuItem[];
  /**
   * Whether the menu is open
   */
  isOpen: boolean;
  /**
   * Anchor element for the menu
   */
  anchorEl: null | HTMLElement;
  /**
   * Callback when menu closes
   */
  onClose?: (close: boolean) => void;
  /**
   * Maximum height of the menu
   */
  maxHeight?: number;
  /**
   * Width of the menu
   * @default 246
   */
  width?: number;
  /**
   * Internal debug mode
   * @internal
   */
  dontUseInternalOnlyDebugMode?: boolean;
  /**
   * Anchor origin for menu positioning
   */
  anchorOrigin?: ApMenuOrigin;
  /**
   * Transform origin for menu positioning
   */
  transformOrigin?: ApMenuOrigin;
  /**
   * Props applied to the underlying MUI Menu component slots.
   * Allows customization of the root and paper elements.
   *
   * The paper slot supports both object and function forms:
   * - Object: `{ paper: { sx: {...} } }`
   * - Function: `{ paper: (ownerState) => ({ sx: {...} }) }`
   *
   * Default maxHeight and width are applied first, allowing user styles to override.
   *
   * Note: Currently only applies to the main menu, not submenus.
   */
  slotProps?: MenuProps['slotProps'];
}>;
