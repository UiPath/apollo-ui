// Auto-generated from toggle/favourite/favourite-checked.svg
import React from 'react';

export interface FavouriteCheckedProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const FavouriteChecked = React.forwardRef<SVGSVGElement, FavouriteCheckedProps>(
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
        d="M12 17.77L18.18 21.5L16.54 14.47L22 9.74L14.81 9.13L12 2.5L9.19 9.13L2 9.74L7.46 14.47L5.82 21.5L12 17.77Z"
        fill="currentColor"
      />
    </svg>
  )
);

FavouriteChecked.displayName = 'FavouriteChecked';

export default FavouriteChecked;
