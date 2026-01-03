// Auto-generated from object/text.svg
import React from 'react';

export interface TextProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Text = React.forwardRef<SVGSVGElement, TextProps>(({ size, ...props }, ref) => (
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
      d="M2.5 7.5V4.5H15.5V7.5H10.5V19.5H7.5V7.5H2.5ZM12.5 9.5H21.5V12.5H18.5V19.5H15.5V12.5H12.5V9.5Z"
      fill="currentColor"
    />
  </svg>
));

Text.displayName = 'Text';

export default Text;
