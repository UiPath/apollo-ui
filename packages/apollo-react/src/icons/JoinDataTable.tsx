// Auto-generated from studio-icons/join-data-table.svg
import React from 'react';

export interface JoinDataTableProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const JoinDataTable = React.forwardRef<SVGSVGElement, JoinDataTableProps>(
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
        d="M3 2H18C18.5523 2 19 2.44772 19 3V4H4V17H3C2.44772 17 2 16.5523 2 16V3C2 2.44772 2.44772 2 3 2Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M21 6H7C6.44772 6 6 6.44772 6 7V21C6 21.5523 6.44772 22 7 22H21C21.5523 22 22 21.5523 22 21V7C22 6.44772 21.5523 6 21 6ZM8 10V8H20V10H8ZM8 12H12V15H8V12ZM14 12V15H20V12H14ZM8 17H12V20H8V17ZM14 20V17H20V20H14Z"
        fill="currentColor"
      />
    </svg>
  )
);

JoinDataTable.displayName = 'JoinDataTable';

export default JoinDataTable;
