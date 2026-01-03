// Auto-generated from navigation/expand-all.svg
import React from 'react';

export interface ExpandAllProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const ExpandAll = React.forwardRef<SVGSVGElement, ExpandAllProps>(
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
        d="M11.61 4.45889L15.4844 8.33333L17.2078 6.61L11.61 1L6 6.61L7.73556 8.33333L11.61 4.45889ZM11.61 19.5411L7.73556 15.6667L6.01222 17.39L11.61 23L17.22 17.39L15.4844 15.6667L11.61 19.5411Z"
        fill="currentColor"
      />
    </svg>
  )
);

ExpandAll.displayName = 'ExpandAll';

export default ExpandAll;
