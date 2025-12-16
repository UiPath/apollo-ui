// Auto-generated from navigation/chevron/chevron-right.svg
import React from 'react';

export interface ChevronRightProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const ChevronRight = React.forwardRef<SVGSVGElement, ChevronRightProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M9.70492 6L8.29492 7.41L12.8749 12L8.29492 16.59L9.70492 18L15.7049 12L9.70492 6Z" fill="currentColor"/>
    </svg>
  )
);

ChevronRight.displayName = 'ChevronRight';

export default ChevronRight;
