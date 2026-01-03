// Auto-generated from studio-activities-icon-sets/activities-control-1/control-1-filter-data-table.svg
import React from 'react';

export interface Control1FilterDataTableProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Control1FilterDataTable = React.forwardRef<
  SVGSVGElement,
  Control1FilterDataTableProps
>(({ size, ...props }, ref) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    ref={ref}
    {...props}
    width={size ?? 24}
    height={size ?? 24}
  >
    <g clipPath="url(#clip0_4117_1520)">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4 2.82373C3.44772 2.82373 3 3.27145 3 3.82373V18.8237C3 19.376 3.44772 19.8237 4 19.8237H11V9.82373H19V12.8237H21V3.82373C21 3.27145 20.5523 2.82373 20 2.82373H4ZM5 4.82373V7.82373H9V4.82373H5ZM5 9.82373H9V12.8237H5V9.82373ZM5 14.8237H9V17.8237H5V14.8237ZM11 4.82373V7.82373H19V4.82373H11Z"
        fill="currentColor"
      />
      <path
        d="M17 21.8237V18.8237L14 14.8237H22L19 18.8237V20.8237L17 21.8237Z"
        fill="currentColor"
      />
    </g>
    <defs>
      <clipPath id="clip0_4117_1520">
        <rect width="24" height="24" fill="var(--color-foreground)" />
      </clipPath>
    </defs>
  </svg>
));

Control1FilterDataTable.displayName = 'Control1FilterDataTable';

export default Control1FilterDataTable;
