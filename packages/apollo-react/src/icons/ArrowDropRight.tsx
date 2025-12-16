// Auto-generated from navigation/arrow-drop-right.svg
import React from 'react';

export interface ArrowDropRightProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const ArrowDropRight = React.forwardRef<SVGSVGElement, ArrowDropRightProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M9.5 17L14.5 12L9.5 7V17Z" fill="currentColor"/>
    </svg>
  )
);

ArrowDropRight.displayName = 'ArrowDropRight';

export default ArrowDropRight;
