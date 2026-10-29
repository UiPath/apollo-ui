// Auto-generated from studio-activities-icon-sets/activities-ui-automation/ui-automation-get-text.svg
import React from 'react';

export interface UIAutomationGetTextProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const UIAutomationGetText = React.forwardRef<SVGSVGElement, UIAutomationGetTextProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <g clipPath="url(#clip0_4117_2286)">
<path d="M17 2C19.2091 2 21 3.79086 21 6V9.16992L22.5898 7.58984L24 9L20 13L16 9L17.4102 7.58008L19 9.16992V6C19 4.89543 18.1046 4 17 4H5C3.89543 4 3 4.89543 3 6V18C3 19.1046 3.89543 20 5 20H17C18.1046 20 19 19.1046 19 18V16H21V18C21 20.14 19.3194 21.8879 17.2061 21.9951L17 22H5L4.79395 21.9951C2.7488 21.8913 1.10865 20.2512 1.00488 18.2061L1 18V6C1 3.79086 2.79086 2 5 2H17Z" fill="currentColor"/>
<path d="M11 17H9V9H6V7H14V9H11V17Z" fill="currentColor"/>
</g>
<defs>
<clipPath id="clip0_4117_2286">
<rect width="24" height="24" fill="var(--color-foreground)"/>
</clipPath>
</defs>
    </svg>
  )
);

UIAutomationGetText.displayName = 'UIAutomationGetText';

export default UIAutomationGetText;
