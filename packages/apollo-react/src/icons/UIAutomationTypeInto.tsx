// Auto-generated from studio-activities-icon-sets/activities-ui-automation/ui-automation-type-into.svg
import React from 'react';

export interface UIAutomationTypeIntoProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const UIAutomationTypeInto = React.forwardRef<SVGSVGElement, UIAutomationTypeIntoProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <g clipPath="url(#clip0_4117_2282)">
<path d="M15.5 4.5V7.5H10.5V19.5H7.5V7.5H2.5V4.5H15.5ZM21.5 9.5V12.5H18.5V19.5H15.5V12.5H12.5V9.5H21.5Z" fill="currentColor"/>
</g>
<defs>
<clipPath id="clip0_4117_2282">
<rect width="24" height="24" fill="var(--color-foreground)"/>
</clipPath>
</defs>
    </svg>
  )
);

UIAutomationTypeInto.displayName = 'UIAutomationTypeInto';

export default UIAutomationTypeInto;
