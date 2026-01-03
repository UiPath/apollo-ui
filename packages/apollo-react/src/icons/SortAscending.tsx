// Auto-generated from action/sort/sort-ascending.svg
import React from 'react';

export interface SortAscendingProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const SortAscending = React.forwardRef<SVGSVGElement, SortAscendingProps>(
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
      <path d="M19 13.2709L11.9999 20L5 13.2709L19 13.2709Z" fill="var(--color-icon)" />
      <path d="M5 9.72917L19 9.72917L11.9999 3.00001L5 9.72917Z" fill="currentColor" />
    </svg>
  )
);

SortAscending.displayName = 'SortAscending';

export default SortAscending;
