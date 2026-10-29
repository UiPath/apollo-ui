// Auto-generated from navigation/menu-collapse.svg
import React from 'react';

export interface MenuCollapseProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const MenuCollapse = React.forwardRef<SVGSVGElement, MenuCollapseProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M2 18H16.4444V15.8333H2V18ZM2 12.5833H13.1111V10.4167H2V12.5833ZM2 5V7.16667H16.4444V5H2ZM22 15.3892L18.0222 11.5L22 7.61083L20.4333 6.08333L14.8778 11.5L20.4333 16.9167L22 15.3892Z" fill="currentColor"/>
    </svg>
  )
);

MenuCollapse.displayName = 'MenuCollapse';

export default MenuCollapse;
