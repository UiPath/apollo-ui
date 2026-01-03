// Auto-generated from navigation/chevron/chevron-down.svg
import React from 'react';

export interface ChevronDownProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const ChevronDown = React.forwardRef<SVGSVGElement, ChevronDownProps>(
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
        d="M16.59 8.29501L12 12.875L7.41 8.29501L6 9.70501L12 15.705L18 9.70501L16.59 8.29501Z"
        fill="currentColor"
      />
    </svg>
  )
);

ChevronDown.displayName = 'ChevronDown';

export default ChevronDown;
