// Auto-generated from indicator-and-alert/alert-info-color.svg
import React from 'react';

export interface AlertInfoColorProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const AlertInfoColor = React.forwardRef<SVGSVGElement, AlertInfoColorProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM11 17V11H13V17H11ZM11 7V9H13V7H11Z" fill="#1976D2"/>
    </svg>
  )
);

AlertInfoColor.displayName = 'AlertInfoColor';

export default AlertInfoColor;
