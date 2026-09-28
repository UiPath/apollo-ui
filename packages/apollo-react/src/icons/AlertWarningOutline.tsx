// Auto-generated from indicator-and-alert/alert-warning-outline.svg
import React from 'react';

export interface AlertWarningOutlineProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const AlertWarningOutline = React.forwardRef<SVGSVGElement, AlertWarningOutlineProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M12 6.49L19.53 19.5H4.47L12 6.49ZM12 2.5L1 21.5H23L12 2.5ZM13 16.5H11V18.5H13V16.5ZM13 10.5H11V14.5H13V10.5Z" fill="currentColor"/>
    </svg>
  )
);

AlertWarningOutline.displayName = 'AlertWarningOutline';

export default AlertWarningOutline;
