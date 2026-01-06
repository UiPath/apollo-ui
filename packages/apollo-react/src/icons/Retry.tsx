// Auto-generated from logic/retry.svg
import React from 'react';

export interface RetryProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Retry = React.forwardRef<SVGSVGElement, RetryProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M9.01 1V4L3 4C1.89543 4 1 4.89543 1 6V19C1 20.1046 1.89543 21 3 21H21C22.1046 21 23 20.1046 23 19V6C23 4.89543 22.1046 4 21 4H17V6H21V19H3V6L9.01 6L9.01 9L13 5L9.01 1Z" fill="currentColor"/>
    </svg>
  )
);

Retry.displayName = 'Retry';

export default Retry;
