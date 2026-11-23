import { Background, BackgroundVariant } from '@uipath/apollo-react/canvas/xyflow/react';
import { BASE_CANVAS_DEFAULTS } from './BaseCanvas.constants';

interface CanvasBackgroundProps {
  color?: string;
  bgColor?: string;
  variant?: BackgroundVariant;
  gap?: number;
  size?: number;
}

export const CanvasBackground: React.FC<CanvasBackgroundProps> = ({
  color = BASE_CANVAS_DEFAULTS.background.color,
  bgColor = BASE_CANVAS_DEFAULTS.background.bgColor,
  variant = BASE_CANVAS_DEFAULTS.background.variant,
  gap = BASE_CANVAS_DEFAULTS.background.gap,
  size = BASE_CANVAS_DEFAULTS.background.size,
}) => {
  return (
    <Background
      className="apollo-canvas-background"
      color={color}
      bgColor={bgColor}
      variant={variant}
      gap={gap}
      size={size}
      // Keep the pattern on multiples of `gap`, the lines nodes snap to (`snapGrid`). This follows
      // the Background maths in @xyflow/react 12.11.6 (CanvasBackground.test.tsx catches drift on
      // an upgrade). React Flow shifts the pattern back by `offset` plus half a pattern cell.
      // Lines and crosses are drawn in the middle of the cell, so that shift cancels out and they
      // need no offset. Dots are drawn `size / 2` into the cell, so they need `gap / 2 + size / 2`,
      // with the dot size React Flow falls back to (1) when `size` is 0.
      offset={variant === BackgroundVariant.Dots ? gap / 2 + (size || 1) / 2 : 0}
    />
  );
};
