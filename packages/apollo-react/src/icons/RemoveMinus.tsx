// Auto-generated from action/remove-minus.svg
import React from 'react';

export interface RemoveMinusProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const RemoveMinus = React.forwardRef<SVGSVGElement, RemoveMinusProps>(
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
      <path d="M19 13H5V11H19V13Z" fill="currentColor" />
    </svg>
  )
);

RemoveMinus.displayName = 'RemoveMinus';

export default RemoveMinus;
