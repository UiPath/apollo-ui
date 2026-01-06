// Auto-generated from editor/label-placement/label-placement-top.svg
import React from 'react';

export interface LabelPlacementTopProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const LabelPlacementTop = React.forwardRef<SVGSVGElement, LabelPlacementTopProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M4.5 7.5L4.5 1.5H3V7.5V9H7.5L7.5 7.5H4.5ZM3 21H21V12H3V21Z" fill="currentColor"/>
    </svg>
  )
);

LabelPlacementTop.displayName = 'LabelPlacementTop';

export default LabelPlacementTop;
