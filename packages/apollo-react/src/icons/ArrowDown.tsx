// Auto-generated from navigation/arrow-down.svg
import React from 'react';

export interface ArrowDownProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const ArrowDown = React.forwardRef<SVGSVGElement, ArrowDownProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M20 12L18.59 10.59L13 16.17V4H11V16.17L5.42 10.58L4 12L12 20L20 12Z" fill="currentColor"/>
    </svg>
  )
);

ArrowDown.displayName = 'ArrowDown';

export default ArrowDown;
