// Auto-generated from indicator-and-alert/priority/priority-low.svg
import React from 'react';

export interface PriorityLowProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const PriorityLow = React.forwardRef<SVGSVGElement, PriorityLowProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M4.26494 8.41121C4.66903 7.92635 5.38968 7.86086 5.87456 8.26493L12 13.3695L18.1254 8.26493C18.6103 7.86086 19.331 7.92635 19.7351 8.41121C20.1391 8.89608 20.0737 9.6167 19.5888 10.0208L12.7317 15.7351C12.3078 16.0883 11.6922 16.0883 11.2683 15.7351L4.41123 10.0208C3.92635 9.6167 3.86085 8.89608 4.26494 8.41121Z" fill="#038108"/>
    </svg>
  )
);

PriorityLow.displayName = 'PriorityLow';

export default PriorityLow;
