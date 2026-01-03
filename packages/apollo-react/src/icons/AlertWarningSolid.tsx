// Auto-generated from indicator-and-alert/alert-warning-solid.svg
import React from 'react';

export interface AlertWarningSolidProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const AlertWarningSolid = React.forwardRef<SVGSVGElement, AlertWarningSolidProps>(
  ({ size, ...props }, ref) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      ref={ref}
      {...props}
      width={size ?? 24}
      height={size ?? 24}
    >
      <path
        d="M1 21.5H23L12 2.5L1 21.5ZM13 18.5H11V16.5H13V18.5ZM13 14.5H11V10.5H13V14.5Z"
        fill="currentColor"
      />
    </svg>
  )
);

AlertWarningSolid.displayName = 'AlertWarningSolid';

export default AlertWarningSolid;
