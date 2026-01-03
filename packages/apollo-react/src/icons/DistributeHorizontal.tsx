// Auto-generated from editor/distribute/distribute-horizontal.svg
import React from 'react';

export interface DistributeHorizontalProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const DistributeHorizontal = React.forwardRef<SVGSVGElement, DistributeHorizontalProps>(
  ({ size, ...props }, ref) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      ref={ref}
      {...props}
      width={size ?? 24}
      height={size ?? 24}
    >
      <path d="M4 22H2V2H4V22ZM22 2H20V22H22V2ZM13.5 7H10.5V17H13.5V7Z" fill="currentColor" />
    </svg>
  )
);

DistributeHorizontal.displayName = 'DistributeHorizontal';

export default DistributeHorizontal;
