// Auto-generated from action/shuffle.svg
import React from 'react';

export interface ShuffleProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Shuffle = React.forwardRef<SVGSVGElement, ShuffleProps>(({ size, ...props }, ref) => (
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
      d="M10.59 9.17L5.41 4L4 5.41L9.17 10.58L10.59 9.17ZM14.5 4L16.54 6.04L4 18.59L5.41 20L17.96 7.46L20 9.5V4H14.5ZM13.42 14.82L14.83 13.41L17.96 16.54L20 14.5V20H14.5L16.55 17.95L13.42 14.82Z"
      fill="currentColor"
    />
  </svg>
));

Shuffle.displayName = 'Shuffle';

export default Shuffle;
