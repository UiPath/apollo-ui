// Auto-generated from navigation/chevron/chevron-left.svg
import React from 'react';

export interface ChevronLeftProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const ChevronLeft = React.forwardRef<SVGSVGElement, ChevronLeftProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M15.7049 7.41L14.2949 6L8.29492 12L14.2949 18L15.7049 16.59L11.1249 12L15.7049 7.41Z" fill="currentColor"/>
    </svg>
  )
);

ChevronLeft.displayName = 'ChevronLeft';

export default ChevronLeft;
