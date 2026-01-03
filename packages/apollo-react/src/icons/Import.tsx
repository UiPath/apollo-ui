// Auto-generated from action/import.svg
import React from 'react';

export interface ImportProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Import = React.forwardRef<SVGSVGElement, ImportProps>(({ size, ...props }, ref) => (
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
      d="M5 12V19H19V12H21V19C21 20.1 20.1 21 19 21H5C3.9 21 3.00001 20.1 3 19V12H5ZM13 12.6699L15.5898 10.0898L17 11.5L12 16.5L7 11.5L8.41016 10.0898L11 12.6699V3H13V12.6699Z"
      fill="currentColor"
    />
  </svg>
));

Import.displayName = 'Import';

export default Import;
