// Auto-generated from studio-activities-icon-sets/activities-control-2/control-2-for-each.svg
import React from 'react';

export interface Control2ForEachProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Control2ForEach = React.forwardRef<SVGSVGElement, Control2ForEachProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <g clipPath="url(#clip0_4117_1597)">
<path d="M9.01 1V4L3 4C1.89543 4 1 4.89543 1 6V19C1 20.1046 1.89543 21 3 21H21C22.1046 21 23 20.1046 23 19V6C23 4.89543 22.1046 4 21 4H17V6H21V19H3V6L9.01 6L9.01 9L13 5L9.01 1Z" fill="currentColor"/>
</g>
<defs>
<clipPath id="clip0_4117_1597">
<rect width="24" height="24" fill="var(--color-foreground)"/>
</clipPath>
</defs>
    </svg>
  )
);

Control2ForEach.displayName = 'Control2ForEach';

export default Control2ForEach;
