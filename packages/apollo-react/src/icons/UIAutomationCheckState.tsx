// Auto-generated from studio-activities-icon-sets/activities-ui-automation/ui-automation-check-state.svg
import React from 'react';

export interface UIAutomationCheckStateProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const UIAutomationCheckState = React.forwardRef<SVGSVGElement, UIAutomationCheckStateProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <g clipPath="url(#clip0_4117_2292)">
<path d="M16 3C17.1046 3 18 3.89543 18 5V19C18 20.1046 17.1046 21 16 21H7V19H16V13H9V11H16V5H7V3H16Z" fill="currentColor"/>
</g>
<defs>
<clipPath id="clip0_4117_2292">
<rect width="24" height="24" fill="var(--color-foreground)"/>
</clipPath>
</defs>
    </svg>
  )
);

UIAutomationCheckState.displayName = 'UIAutomationCheckState';

export default UIAutomationCheckState;
