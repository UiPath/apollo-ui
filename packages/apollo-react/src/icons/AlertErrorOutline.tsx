// Auto-generated from indicator-and-alert/alert-error-outline.svg
import React from 'react';

export interface AlertErrorOutlineProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const AlertErrorOutline = React.forwardRef<SVGSVGElement, AlertErrorOutlineProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M12 17.5556C12.3148 17.5556 12.5787 17.4491 12.7917 17.2361C13.0046 17.0231 13.1111 16.7593 13.1111 16.4444C13.1111 16.1296 13.0046 15.8657 12.7917 15.6528C12.5787 15.4398 12.3148 15.3333 12 15.3333C11.6852 15.3333 11.4213 15.4398 11.2083 15.6528C10.9954 15.8657 10.8889 16.1296 10.8889 16.4444C10.8889 16.7593 10.9954 17.0231 11.2083 17.2361C11.4213 17.4491 11.6852 17.5556 12 17.5556ZM10.8889 13.1111H13.1111V6.44444H10.8889V13.1111ZM7.83333 22L2 16.1667V7.83333L7.83333 2H16.1667L22 7.83333V16.1667L16.1667 22H7.83333ZM8.77778 19.7778H15.2222L19.7778 15.2222V8.77778L15.2222 4.22222H8.77778L4.22222 8.77778V15.2222L8.77778 19.7778Z" fill="currentColor"/>
    </svg>
  )
);

AlertErrorOutline.displayName = 'AlertErrorOutline';

export default AlertErrorOutline;
