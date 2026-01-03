// Auto-generated from logic/repeat.svg
import React from 'react';

export interface RepeatProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Repeat = React.forwardRef<SVGSVGElement, RepeatProps>(({ size, ...props }, ref) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    ref={ref}
    {...props}
    width={size ?? 24}
    height={size ?? 24}
  >
    <path
      d="M11.01 4L3 4C1.89543 4 1 4.89543 1 6V18C1 19.1046 1.89543 20 3 20H7V18H3V6L11.01 6L11.01 9L15 5L11.01 1V4Z"
      fill="currentColor"
    />
    <path
      d="M21 4C22.1046 4 23 4.89543 23 6V18C23 19.1046 22.1046 20 21 20H12.99V23L9 19L12.99 15L12.99 18H21V6H17V4H21Z"
      fill="currentColor"
    />
  </svg>
));

Repeat.displayName = 'Repeat';

export default Repeat;
