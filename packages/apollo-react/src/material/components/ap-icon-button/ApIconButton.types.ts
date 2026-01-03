import type { IconButtonProps as MuiIconButtonProps } from '@mui/material';

export interface ApIconButtonProps extends MuiIconButtonProps {
  /**
   * Accessible label for the icon button
   */
  label?: string;
  /**
   * Whether the button controls an expanded element
   */
  expanded?: boolean;
}
