// Auto-generated from indicator-and-alert/alert-warning.svg
import React from 'react';

export interface AlertWarningProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const AlertWarning = React.forwardRef<SVGSVGElement, AlertWarningProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M1 21H23L12 2L1 21Z" fill="#FFB40E"/>
<path d="M13 18H11V16H13V18Z" fill="currentColor"/>
<path d="M13 14H11V10H13V14Z" fill="currentColor"/>
    </svg>
  )
);

AlertWarning.displayName = 'AlertWarning';

export default AlertWarning;
