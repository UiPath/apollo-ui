// Auto-generated from navigation/fullscreen-maximize.svg
import React from 'react';

export interface FullscreenMaximizeProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const FullscreenMaximize = React.forwardRef<SVGSVGElement, FullscreenMaximizeProps>(
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
        d="M7 14H5V19H10V17H7V14ZM5 10H7V7H10V5H5V10ZM17 17H14V19H19V14H17V17ZM14 5V7H17V10H19V5H14Z"
        fill="currentColor"
      />
    </svg>
  )
);

FullscreenMaximize.displayName = 'FullscreenMaximize';

export default FullscreenMaximize;
