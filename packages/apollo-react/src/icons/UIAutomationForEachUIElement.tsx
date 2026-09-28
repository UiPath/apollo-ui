// Auto-generated from studio-activities-icon-sets/activities-ui-automation/ui-automation-for-each-ui-element.svg
import React from 'react';

export interface UIAutomationForEachUIElementProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const UIAutomationForEachUIElement = React.forwardRef<SVGSVGElement, UIAutomationForEachUIElementProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <g clipPath="url(#clip0_4117_2312)">
<path fillRule="evenodd" clipRule="evenodd" d="M7 16C7 15.4477 7.44772 15 8 15H22C22.5523 15 23 15.4477 23 16V22C23 22.5523 22.5523 23 22 23H8C7.44772 23 7 22.5523 7 22V16ZM21 21H9V17H21V21Z" fill="#1976D2"/>
<path d="M9.01 1V4L3 4C1.89543 4 1 4.89543 1 6V19C1 20.1046 1.89543 21 3 21H5V19H3V6L9.01 6L9.01 9L13 5L9.01 1Z" fill="currentColor"/>
<path d="M23 6V13H21V6H17V4H21C22.1046 4 23 4.89543 23 6Z" fill="currentColor"/>
</g>
<defs>
<clipPath id="clip0_4117_2312">
<rect width="24" height="24" fill="var(--color-foreground)"/>
</clipPath>
</defs>
    </svg>
  )
);

UIAutomationForEachUIElement.displayName = 'UIAutomationForEachUIElement';

export default UIAutomationForEachUIElement;
