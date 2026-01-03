// Auto-generated from action/fast-rewind.svg
import React from 'react';

export interface FastRewindProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const FastRewind = React.forwardRef<SVGSVGElement, FastRewindProps>(
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
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.25 12L11.75 6V18L3.25 12ZM20.75 6L12.25 12L20.75 18V6ZM6.72 12L9.75 14.14V9.86L6.72 12ZM15.72 12L18.75 14.14V9.86L15.72 12Z"
        fill="currentColor"
      />
    </svg>
  )
);

FastRewind.displayName = 'FastRewind';

export default FastRewind;
