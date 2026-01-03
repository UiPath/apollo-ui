// Auto-generated from editor/distribute/distribute-vertical.svg
import React from 'react';

export interface DistributeVerticalProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const DistributeVertical = React.forwardRef<SVGSVGElement, DistributeVerticalProps>(
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
      <path d="M2 22V20H22V22H2ZM7 13.5V10.5H17V13.5H7ZM2 4V2H22V4H2Z" fill="currentColor" />
    </svg>
  )
);

DistributeVertical.displayName = 'DistributeVertical';

export default DistributeVertical;
