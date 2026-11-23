import { memo } from 'react';
import { NODE_BADGE_SIZE } from '../../constants';
import type { NodeShape } from '../../schema';
import { getNodeBadgeInset } from './BaseNodeBadgeSlot.utils';

interface BaseBadgeSlotProps {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  shape?: NodeShape;
  children: React.ReactNode;
}

export const BaseBadgeSlot = memo(({ position, shape, children }: BaseBadgeSlotProps) => {
  const offset = getNodeBadgeInset(shape);
  const style: React.CSSProperties = { width: NODE_BADGE_SIZE, height: NODE_BADGE_SIZE };
  switch (position) {
    case 'top-left':
      style.top = offset;
      style.left = offset;
      break;
    case 'top-right':
      style.top = offset;
      style.right = offset;
      break;
    case 'bottom-left':
      style.bottom = offset;
      style.left = offset;
      break;
    case 'bottom-right':
      style.bottom = offset;
      style.right = offset;
      break;
  }
  return (
    <div className="absolute flex items-center justify-center bg-transparent" style={style}>
      {children}
    </div>
  );
});
