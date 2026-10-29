// Auto-generated from object/data-type/type-table.svg
import React from 'react';

export interface TypeTableProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const TypeTable = React.forwardRef<SVGSVGElement, TypeTableProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M22 2H2V22H22V2ZM4 14V10H8V14H4ZM4 16V20H8V16H4ZM10 16V20H20V16H10ZM20 14V10H10V14H20ZM8 8H4V4H8V8ZM10 8H20V4H10V8Z" fill="currentColor"/>
    </svg>
  )
);

TypeTable.displayName = 'TypeTable';

export default TypeTable;
