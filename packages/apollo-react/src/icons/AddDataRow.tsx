// Auto-generated from studio-icons/add-data-row.svg
import React from 'react';

export interface AddDataRowProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const AddDataRow = React.forwardRef<SVGSVGElement, AddDataRowProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M4 3C3.44772 3 3 3.44772 3 4V19C3 19.5523 3.44772 20 4 20H20C20.5523 20 21 19.5523 21 19V18H11V15H16V13H11V10H21V4C21 3.44772 20.5523 3 20 3H4ZM5 5V8H9V5H5ZM5 10H9V13H5V10ZM5 15H9V18H5V15ZM11 5V8H19V5H11Z" fill="currentColor"/>
<path d="M21 11H19V13H17V15H19V17H21V15H23V13H21V11Z" fill="#038108"/>
    </svg>
  )
);

AddDataRow.displayName = 'AddDataRow';

export default AddDataRow;
