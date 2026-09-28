// Auto-generated from editor/layout-stretch/layout-stretch-horizontal.svg
import React from 'react';

export interface LayoutStretchHorizontalProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const LayoutStretchHorizontal = React.forwardRef<SVGSVGElement, LayoutStretchHorizontalProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M19.5 21L19.5 3L21 3L21 21L19.5 21ZM3 21L3 3L4.5 3L4.5 21L3 21ZM13.5 4.5L13.5 19.5L16.5 19.5L16.5 4.5L13.5 4.5ZM7.5 4.5L7.5 19.5L10.5 19.5L10.5 4.5L7.5 4.5Z" fill="currentColor"/>
    </svg>
  )
);

LayoutStretchHorizontal.displayName = 'LayoutStretchHorizontal';

export default LayoutStretchHorizontal;
