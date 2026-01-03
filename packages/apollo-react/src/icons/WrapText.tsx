// Auto-generated from editor/wrap-text.svg
import React from 'react';

export interface WrapTextProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const WrapText = React.forwardRef<SVGSVGElement, WrapTextProps>(
  ({ size, ...props }, ref) => (
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
        d="M3.5 18H9.5V16H3.5V18ZM19.5 4H3.5V6H19.5V4ZM16.5 10H3.5V12H16.75C17.85 12 18.75 12.9 18.75 14C18.75 15.1 17.85 16 16.75 16H14.5V14L11.5 17L14.5 20V18H16.5C18.71 18 20.5 16.21 20.5 14C20.5 11.79 18.71 10 16.5 10Z"
        fill="currentColor"
      />
    </svg>
  )
);

WrapText.displayName = 'WrapText';

export default WrapText;
