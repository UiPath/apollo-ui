// Auto-generated from object/cloud.svg
import React from 'react';

export interface CloudProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Cloud = React.forwardRef<SVGSVGElement, CloudProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M5.35 8.04C6.6 5.64 9.11 4 12 4C15.64 4 18.67 6.59 19.35 10.04C21.95 10.22 24 12.36 24 15C24 17.76 21.76 20 19 20H6C2.69 20 0 17.31 0 14C0 10.91 2.34 8.36 5.35 8.04ZM17.39 10.43C16.88 7.86 14.62 6 12 6C9.94 6 8.08 7.14 7.13 8.97L6.63 9.92L5.56 10.03C3.53 10.24 2 11.95 2 14C2 16.21 3.79 18 6 18H19C20.65 18 22 16.65 22 15C22 13.45 20.78 12.14 19.22 12.04L17.69 11.93L17.39 10.43Z" fill="currentColor"/>
    </svg>
  )
);

Cloud.displayName = 'Cloud';

export default Cloud;
