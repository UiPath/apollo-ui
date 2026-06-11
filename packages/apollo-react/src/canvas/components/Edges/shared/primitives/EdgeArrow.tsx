import { EDGE_CONSTANTS } from '../constants';
import type { Point } from '../types';

const { ARROW_SIZE, ARROW_HALF_ANGLE } = EDGE_CONSTANTS;
const ARROW_TRANSITION = 'fill 0.2s ease, opacity 0.2s ease';

export type EdgeArrowProps = {
  /** Tip of the arrow — the target node anchor point. */
  target: Point;
  /** Angle pointing INTO the target (radians). */
  angle: number;
  /** Inset offset translating the arrow away from the node edge. */
  offset: Point;
  color: string;
  opacity?: number;
};

export function EdgeArrow({ target, angle, offset, color, opacity = 1 }: EdgeArrowProps) {
  const tipX = target.x;
  const tipY = target.y;
  const leftX = tipX - ARROW_SIZE * Math.cos(angle - ARROW_HALF_ANGLE);
  const leftY = tipY - ARROW_SIZE * Math.sin(angle - ARROW_HALF_ANGLE);
  const rightX = tipX - ARROW_SIZE * Math.cos(angle + ARROW_HALF_ANGLE);
  const rightY = tipY - ARROW_SIZE * Math.sin(angle + ARROW_HALF_ANGLE);

  return (
    <polygon
      points={`${tipX},${tipY} ${leftX},${leftY} ${rightX},${rightY}`}
      fill={color}
      style={{
        pointerEvents: 'none',
        opacity,
        transition: ARROW_TRANSITION,
        transform: `translate(${offset.x}px, ${offset.y}px)`,
      }}
    />
  );
}
