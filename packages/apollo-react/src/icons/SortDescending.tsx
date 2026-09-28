// Auto-generated from action/sort/sort-descending.svg
import React from 'react';

export interface SortDescendingProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const SortDescending = React.forwardRef<SVGSVGElement, SortDescendingProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M5 9.72916L12.0001 3L19 9.72916L5 9.72916Z" fill="var(--color-icon)"/>
<path d="M19 13.2709L5 13.2709L12.0001 20L19 13.2709Z" fill="currentColor"/>
    </svg>
  )
);

SortDescending.displayName = 'SortDescending';

export default SortDescending;
