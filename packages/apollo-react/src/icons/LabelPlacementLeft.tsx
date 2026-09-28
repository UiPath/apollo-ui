// Auto-generated from editor/label-placement/label-placement-left.svg
import React from 'react';

export interface LabelPlacementLeftProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const LabelPlacementLeft = React.forwardRef<SVGSVGElement, LabelPlacementLeftProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M0 15V7.5H1.5L1.5 15L4.5 15V16.5H1.5H0V15ZM9 16.5H24V7.5H9L9 16.5Z" fill="currentColor"/>
    </svg>
  )
);

LabelPlacementLeft.displayName = 'LabelPlacementLeft';

export default LabelPlacementLeft;
