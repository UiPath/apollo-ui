// Auto-generated from studio-icons/check-state.svg
import React from 'react';

export interface CheckStateProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const CheckState = React.forwardRef<SVGSVGElement, CheckStateProps>(
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
      <path
        d="M16 3C17.1046 3 18 3.89543 18 5V19C18 20.1046 17.1046 21 16 21H7V19H16V13H9V11H16V5H7V3H16Z"
        fill="currentColor"
      />
    </svg>
  )
);

CheckState.displayName = 'CheckState';

export default CheckState;
