// Auto-generated from navigation/check.svg
import React from 'react';

export interface CheckProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Check = React.forwardRef<SVGSVGElement, CheckProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M8.79508 15.875L4.62508 11.705L3.20508 13.115L8.79508 18.705L20.7951 6.70501L19.3851 5.29501L8.79508 15.875Z" fill="currentColor"/>
    </svg>
  )
);

Check.displayName = 'Check';

export default Check;
