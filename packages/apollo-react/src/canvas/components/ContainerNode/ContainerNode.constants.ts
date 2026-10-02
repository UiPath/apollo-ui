import { NODE_BADGE_INSET_SQUARE, NODE_BADGE_SIZE } from '../../constants';
import {
  type ContainerResizeMinimums,
  DEFAULT_CONTAINER_MIN_HEIGHT,
  DEFAULT_CONTAINER_MIN_WIDTH,
} from '../../utils/container';
import type { ContainerAccent, ContainerBodyFrame, ContainerRadius } from './ContainerNode.types';

export const DEFAULT_CONTAINER_ICON = 'box';
export const LOOP_KIND = 'loop';
export const EMPTY_DATA: Record<string, unknown> = {};
export const HEADER_ADORNMENT_GAP = 8;
export const HEADER_ADORNMENT_PADDING =
  NODE_BADGE_INSET_SQUARE + NODE_BADGE_SIZE + HEADER_ADORNMENT_GAP;

// Static class maps so Tailwind can see every class. Colors come from the
// semantic tokens, which already switch for light, dark and high-contrast themes.
export const RADIUS_CLASSES: Record<
  ContainerRadius,
  { root: string; clip: string; header: string; body: string }
> = {
  default: {
    root: 'rounded-[20px]',
    clip: 'rounded-[19px]',
    header: 'rounded-t-[18px]',
    body: 'rounded-xl',
  },
  xl: { root: 'rounded-xl', clip: 'rounded-[11px]', header: 'rounded-t-[10px]', body: 'rounded' },
  lg: { root: 'rounded-lg', clip: 'rounded-[7px]', header: 'rounded-t-[6px]', body: 'rounded-sm' },
};
export const ACCENT_BORDER_CLASSES: Record<ContainerAccent, string> = {
  default: 'border-border',
  info: 'border-info',
  warning: 'border-warning',
  error: 'border-error',
  success: 'border-success',
};
export const ACCENT_ICON_CLASSES: Record<ContainerAccent, string> = {
  default: 'text-foreground',
  info: 'text-info',
  warning: 'text-warning',
  error: 'text-error',
  success: 'text-success',
};
export const BODY_FRAME_CLASSES: Record<ContainerBodyFrame, string> = {
  dashed: 'border-[1.5px] border-dashed border-border',
  solid: 'border-[1.5px] border-solid border-border',
  none: 'border-[1.5px] border-transparent',
};

export const RESIZE_CONTROLS = [
  {
    position: 'top-left',
    widthSide: 'left',
    heightSide: 'top',
    cursor: 'nwse-resize',
    indicatorClassName: 'top-[-4px] left-[-4px]',
  },
  {
    position: 'top-right',
    widthSide: 'right',
    heightSide: 'top',
    cursor: 'nesw-resize',
    indicatorClassName: 'top-[-4px] right-[-4px]',
  },
  {
    position: 'bottom-left',
    widthSide: 'left',
    heightSide: 'bottom',
    cursor: 'nesw-resize',
    indicatorClassName: 'bottom-[-4px] left-[-4px]',
  },
  {
    position: 'bottom-right',
    widthSide: 'right',
    heightSide: 'bottom',
    cursor: 'nwse-resize',
    indicatorClassName: 'bottom-[-4px] right-[-4px]',
  },
] as const;
export const RESIZE_CONTROL_STYLE = {
  background: 'transparent',
  border: 'none',
  zIndex: 100,
} as const;
export const DEFAULT_RESIZE_MINIMUMS: ContainerResizeMinimums = {
  left: DEFAULT_CONTAINER_MIN_WIDTH,
  right: DEFAULT_CONTAINER_MIN_WIDTH,
  top: DEFAULT_CONTAINER_MIN_HEIGHT,
  bottom: DEFAULT_CONTAINER_MIN_HEIGHT,
};

export const ADORNMENT_SLOT_POSITIONS = [
  'topLeft',
  'topRight',
  'bottomLeft',
  'bottomRight',
] as const;
export const ADORNMENT_SLOT_SHAPES: Record<
  (typeof ADORNMENT_SLOT_POSITIONS)[number],
  'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
> = {
  topLeft: 'top-left',
  topRight: 'top-right',
  bottomLeft: 'bottom-left',
  bottomRight: 'bottom-right',
};
