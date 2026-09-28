// Auto-generated from studio-activities-icon-sets/activities-ui-automation/ui-automation-select-item.svg
import React from 'react';

export interface UIAutomationSelectItemProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const UIAutomationSelectItem = React.forwardRef<SVGSVGElement, UIAutomationSelectItemProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <g clipPath="url(#clip0_4117_2290)">
<path d="M20 20C20.5523 20 21 20.4477 21 21C21 21.5523 20.5523 22 20 22H4C3.44772 22 3 21.5523 3 21C3 20.4477 3.44772 20 4 20H20ZM20 16C20.5523 16 21 16.4477 21 17C21 17.5523 20.5523 18 20 18H4C3.44772 18 3 17.5523 3 17C3 16.4477 3.44772 16 4 16H20ZM18 9C18.5523 9 19 9.44772 19 10C19 10.5523 18.5523 11 18 11H6C5.44772 11 5 10.5523 5 10C5 9.44772 5.44772 9 6 9H18ZM20 2C20.5523 2 21 2.44772 21 3C21 3.55228 20.5523 4 20 4H4C3.44772 4 3 3.55228 3 3C3 2.44772 3.44772 2 4 2H20Z" fill="currentColor"/>
<mask id="path-2-inside-1_4117_2290" fill="var(--color-foreground)">
<rect x="1" y="6" width="22" height="8" rx="1"/>
</mask>
<rect x="1" y="6" width="22" height="8" rx="1" stroke="#1976D2" strokeWidth="4" mask="url(#path-2-inside-1_4117_2290)"/>
</g>
<defs>
<clipPath id="clip0_4117_2290">
<rect width="24" height="24" fill="var(--color-foreground)"/>
</clipPath>
</defs>
    </svg>
  )
);

UIAutomationSelectItem.displayName = 'UIAutomationSelectItem';

export default UIAutomationSelectItem;
