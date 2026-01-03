// Auto-generated from editor/figure/figure-rectangle-169.svg
import React from 'react';

export interface FigureRectangle169Props
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const FigureRectangle169 = React.forwardRef<SVGSVGElement, FigureRectangle169Props>(
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
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5 6H19C20.1 6 21 6.9 21 8V16C21 17.1 20.1 18 19 18H5C3.9 18 3 17.1 3 16V8C3 6.9 3.9 6 5 6ZM5 16H19V8H5V16Z"
        fill="currentColor"
      />
    </svg>
  )
);

FigureRectangle169.displayName = 'FigureRectangle169';

export default FigureRectangle169;
