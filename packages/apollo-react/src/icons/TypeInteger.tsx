// Auto-generated from object/data-type/type-integer.svg
import React from 'react';

export interface TypeIntegerProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const TypeInteger = React.forwardRef<SVGSVGElement, TypeIntegerProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M4 6C5.05436 6 5.91817 6.81588 5.99451 7.85074L6 8V18H4V8H2V6H4ZM12 6C13.6569 6 15 7.34315 15 9V10C15 11.6569 13.6569 13 12 13H11C10.4477 13 10 13.4477 10 14V16H15V18H8V14C8 12.3431 9.34315 11 11 11H12C12.5523 11 13 10.5523 13 10V9C13 8.44772 12.5523 8 12 8H8V6H12ZM20 16V13H16V11H20V8H16V6H20C21.0544 6 21.9182 6.81588 21.9945 7.85074L22 8V11C22 11.5523 21.5523 12 21 12C21.5523 12 22 12.4477 22 13V16C22 17.1046 21.1046 18 20 18H16V16H20Z" fill="currentColor"/>
    </svg>
  )
);

TypeInteger.displayName = 'TypeInteger';

export default TypeInteger;
