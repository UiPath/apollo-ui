// Auto-generated from studio-icons/sort-data-table.svg
import React from 'react';

export interface SortDataTableProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const SortDataTable = React.forwardRef<SVGSVGElement, SortDataTableProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M3 4C3 3.44772 3.44772 3 4 3H20C20.5523 3 21 3.44772 21 4V15H11V20H4C3.44772 20 3 19.5523 3 19V4ZM5 8V5H9V8H5ZM9 10H5V13H9V10ZM11 13V10H19V13H11ZM9 15H5V18H9V15ZM11 8V5H19V8H11Z" fill="currentColor"/>
<path d="M13 17L17.5 22L22 17H13Z" fill="currentColor"/>
    </svg>
  )
);

SortDataTable.displayName = 'SortDataTable';

export default SortDataTable;
