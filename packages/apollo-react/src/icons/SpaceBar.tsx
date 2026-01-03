// Auto-generated from editor/space-bar.svg
import React from 'react';

export interface SpaceBarProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const SpaceBar = React.forwardRef<SVGSVGElement, SpaceBarProps>(
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
      <path d="M18 9V13H6V9H4V15H20V9H18Z" fill="currentColor" />
    </svg>
  )
);

SpaceBar.displayName = 'SpaceBar';

export default SpaceBar;
