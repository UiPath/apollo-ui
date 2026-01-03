// Auto-generated from studio-activities-icon-sets/activities-control-1/control-1-merge-data-table.svg
import React from 'react';

export interface Control1MergeDataTableProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Control1MergeDataTable = React.forwardRef<SVGSVGElement, Control1MergeDataTableProps>(
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
      <g clipPath="url(#clip0_4117_1532)">
        <path
          d="M3 1.82373H18C18.5523 1.82373 19 2.27145 19 2.82373V3.82373H4V16.8237H3C2.44772 16.8237 2 16.376 2 15.8237V2.82373C2 2.27145 2.44772 1.82373 3 1.82373Z"
          fill="currentColor"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M21 5.82373H7C6.44772 5.82373 6 6.27145 6 6.82373V20.8237C6 21.376 6.44772 21.8237 7 21.8237H21C21.5523 21.8237 22 21.376 22 20.8237V6.82373C22 6.27145 21.5523 5.82373 21 5.82373ZM8 9.82373V7.82373H20V9.82373H8ZM8 11.8237H12V14.8237H8V11.8237ZM14 11.8237V14.8237H20V11.8237H14ZM8 16.8237H12V19.8237H8V16.8237ZM14 19.8237V16.8237H20V19.8237H14Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0_4117_1532">
          <rect width="24" height="24" fill="var(--color-foreground)" />
        </clipPath>
      </defs>
    </svg>
  )
);

Control1MergeDataTable.displayName = 'Control1MergeDataTable';

export default Control1MergeDataTable;
