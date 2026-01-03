// Auto-generated from indicator-and-alert/priority/priority-high.svg
import React from 'react';

export interface PriorityHighProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const PriorityHigh = React.forwardRef<SVGSVGElement, PriorityHighProps>(
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
        d="M11.2683 8.2649C11.6922 7.9117 12.3078 7.9117 12.7317 8.2649L19.5888 13.9792C20.0737 14.3833 20.1391 15.1039 19.7351 15.5888C19.331 16.0737 18.6103 16.1391 18.1254 15.7351L12 10.6305L5.87456 15.7351C5.38968 16.1391 4.66903 16.0737 4.26494 15.5888C3.86085 15.1039 3.92635 14.3833 4.41123 13.9792L11.2683 8.2649Z"
        fill="#CC3D45"
      />
    </svg>
  )
);

PriorityHigh.displayName = 'PriorityHigh';

export default PriorityHigh;
