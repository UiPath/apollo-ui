// Auto-generated from object/code.svg
import React from 'react';

export interface CodeProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Code = React.forwardRef<SVGSVGElement, CodeProps>(({ size, ...props }, ref) => (
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
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4.8 12L9.4 16.6L8 18L2 12L8 6L9.4 7.4L4.8 12ZM19.2 12L14.6 16.6L16 18L22 12L16 6L14.6 7.4L19.2 12Z"
      fill="currentColor"
    />
  </svg>
));

Code.displayName = 'Code';

export default Code;
