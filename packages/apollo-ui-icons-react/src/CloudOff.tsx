// Auto-generated from object/cloud-off.svg
import React from 'react';

export interface CloudOffProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const CloudOff = React.forwardRef<SVGSVGElement, CloudOffProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M4.41 2.92999L3 4.33999L5.77 7.10999H5.35C2.34 7.42999 0 9.97999 0 13.07C0 16.38 2.69 19.07 6 19.07H17.73L19.73 21.07L21.14 19.66L4.41 2.92999ZM24 14.07C24 11.43 21.95 9.28999 19.35 9.10999C18.67 5.65999 15.64 3.06999 12 3.06999C10.67 3.06999 9.43 3.42999 8.35 4.03999L9.84 5.52999C10.51 5.23999 11.23 5.06999 12 5.06999C15.04 5.06999 17.5 7.52999 17.5 10.57V11.07H19C20.66 11.07 22 12.41 22 14.07C22 15.06 21.52 15.92 20.79 16.47L22.2 17.88C23.29 16.96 24 15.61 24 14.07ZM2 13.07C2 15.28 3.79 17.07 6 17.07H15.73L7.73 9.06999H6C3.79 9.06999 2 10.86 2 13.07Z" fill="currentColor"/>
    </svg>
  )
);

CloudOff.displayName = 'CloudOff';

export default CloudOff;
