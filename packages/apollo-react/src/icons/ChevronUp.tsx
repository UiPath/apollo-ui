// Auto-generated from navigation/chevron/chevron-up.svg
import React from 'react';

export interface ChevronUpProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const ChevronUp = React.forwardRef<SVGSVGElement, ChevronUpProps>(
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
        d="M12 8.29501L6 14.295L7.41 15.705L12 11.125L16.59 15.705L18 14.295L12 8.29501Z"
        fill="currentColor"
      />
    </svg>
  )
);

ChevronUp.displayName = 'ChevronUp';

export default ChevronUp;
