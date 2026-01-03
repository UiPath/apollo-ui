// Auto-generated from editor/figure/figure-square.svg
import React from 'react';

export interface FigureSquareProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const FigureSquare = React.forwardRef<SVGSVGElement, FigureSquareProps>(
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
        d="M5 3H19C20.1 3 21 3.9 21 5V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3ZM5 19H19V5H5V19Z"
        fill="currentColor"
      />
    </svg>
  )
);

FigureSquare.displayName = 'FigureSquare';

export default FigureSquare;
