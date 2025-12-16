// Auto-generated from studio-activities-icon-sets/activities-control-1/control-1-replace.svg
import React from 'react';

export interface Control1ReplaceProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Control1Replace = React.forwardRef<SVGSVGElement, Control1ReplaceProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <g clipPath="url(#clip0_4117_1450)">
<path d="M11.01 4L3 4C1.89543 4 1 4.89543 1 6V18C1 19.1046 1.89543 20 3 20H7V18H3V6L11.01 6L11.01 9L15 5L11.01 1V4Z" fill="currentColor"/>
<path d="M21 4C22.1046 4 23 4.89543 23 6V18C23 19.1046 22.1046 20 21 20H12.99V23L9 19L12.99 15L12.99 18H21V6H17V4H21Z" fill="currentColor"/>
</g>
<defs>
<clipPath id="clip0_4117_1450">
<rect width="24" height="24" fill="var(--color-foreground)"/>
</clipPath>
</defs>
    </svg>
  )
);

Control1Replace.displayName = 'Control1Replace';

export default Control1Replace;
