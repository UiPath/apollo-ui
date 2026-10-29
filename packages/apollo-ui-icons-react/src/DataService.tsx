// Auto-generated from product-logo/data-service.svg
import React from 'react';

export interface DataServiceProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const DataService = React.forwardRef<SVGSVGElement, DataServiceProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M5.07407 9.25002L12 4.05555L18.9259 9.25002L12 14.4444L5.07407 9.25002ZM1 9.25003L12 1L23 9.25003L12 17.5L1 9.25003ZM2.5869 12.6739L11.9997 19.7526L21.4091 12.674L22.8786 14.6274L11.9999 22.8113L1.1177 14.6275L2.5869 12.6739Z" fill="currentColor"/>
    </svg>
  )
);

DataService.displayName = 'DataService';

export default DataService;
