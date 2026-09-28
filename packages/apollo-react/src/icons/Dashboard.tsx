// Auto-generated from object/dashboard.svg
import React from 'react';

export interface DashboardProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Dashboard = React.forwardRef<SVGSVGElement, DashboardProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path fillRule="evenodd" clipRule="evenodd" d="M3 3V21H11.1V3H3ZM9.1 5H5V19H9.1V5Z" fill="currentColor"/>
<path fillRule="evenodd" clipRule="evenodd" d="M12.8999 11.1V21H20.9999V11.1H12.8999ZM18.9999 13.1H14.8999V19H18.9999V13.1Z" fill="currentColor"/>
<path fillRule="evenodd" clipRule="evenodd" d="M12.8999 9.3V3H20.9999V9.3H12.8999ZM14.8999 5H18.9999V7.3H14.8999V5Z" fill="currentColor"/>
    </svg>
  )
);

Dashboard.displayName = 'Dashboard';

export default Dashboard;
