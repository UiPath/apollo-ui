import type { TooltipProps as MuiTooltipProps } from '@mui/material';
import type React from 'react';

type TooltipPlacement = 'top' | 'right' | 'bottom' | 'left' | 'top-start';

// Ensure content is properly omitted from MUI props
type MuiPropsWithoutCustom = Omit<MuiTooltipProps, 'title' | 'children' | 'placement' | 'content'>;

export interface ApTooltipProps extends MuiPropsWithoutCustom {
  /**
   * Tooltip content - can be string or React node
   */
  content: string | React.ReactNode;
  /**
   * Tooltip placement relative to the child element
   * @default 'bottom'
   */
  placement?: TooltipPlacement;
  /**
   * Whether tooltip is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Whether to hide the tooltip
   */
  hide?: boolean;
  /**
   * Controlled open state
   */
  isOpen?: boolean;
  /**
   * Whether to delay showing the tooltip
   * @default false
   */
  delay?: boolean;
  /**
   * Child element that triggers the tooltip
   */
  children: React.ReactElement;
  /**
   * Custom formatted content (overrides content prop)
   */
  formattedContent?: React.ReactNode;
  /**
   * Internal debug option to force tooltip open
   * @internal
   */
  dontUseInternalOnlyDebugForceOpen?: boolean;
  /**
   * Only show tooltip if text is truncated with ellipsis
   * @default false
   */
  smartTooltip?: boolean;
  /**
   * Callback when tooltip opens
   */
  onTooltipOpen?: (event: React.SyntheticEvent) => void;
  /**
   * Callback when tooltip closes
   */
  onTooltipClose?: (event: React.SyntheticEvent | Event) => void;
  /**
   * Close tooltip on user interaction (click, input)
   * @default false
   */
  closeOnInteraction?: boolean;
}
