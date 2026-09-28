// Auto-generated from indicator-and-alert/alert-delete.svg
import React from 'react';

export interface AlertDeleteProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const AlertDelete = React.forwardRef<SVGSVGElement, AlertDeleteProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M12 2C17.52 2 22 6.48 22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2Z" fill="#CC3D45"/>
<path d="M15.4297 16.1436C15.4297 16.7721 14.9147 17.2861 14.2861 17.2861H9.71484C9.08626 17.2861 8.57229 16.7721 8.57227 16.1436V9.28613H15.4297V16.1436ZM9.71387 16.1436H14.2861V10.4287H9.71387V16.1436ZM13.4287 7L14 7.57129H16V8.71484H8V7.57129H10L10.5713 7H13.4287Z" fill="var(--color-foreground)"/>
    </svg>
  )
);

AlertDelete.displayName = 'AlertDelete';

export default AlertDelete;
