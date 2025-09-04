import { Background, type BackgroundVariant } from "@xyflow/react";
import { BASE_CANVAS_DEFAULTS } from "./BaseCanvas.constants";

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
  return <Background color={color} bgColor={bgColor} variant={variant} gap={gap} size={size} offset={gap + 1} />;
};
