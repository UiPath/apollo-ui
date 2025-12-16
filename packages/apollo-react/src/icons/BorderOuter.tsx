// Auto-generated from editor/border/border-outer.svg
import React from 'react';

export interface BorderOuterProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const BorderOuter = React.forwardRef<SVGSVGElement, BorderOuterProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M13 7H11V9H13V7ZM13 11H11V13H13V11ZM17 11H15V13H17V11ZM3 3V21H21V3H3ZM19 19H5V5H19V19ZM13 15H11V17H13V15ZM9 11H7V13H9V11Z" fill="currentColor"/>
    </svg>
  )
);

BorderOuter.displayName = 'BorderOuter';

export default BorderOuter;
