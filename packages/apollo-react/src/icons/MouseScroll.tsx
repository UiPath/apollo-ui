// Auto-generated from studio-icons/mouse-scroll.svg
import React from 'react';

export interface MouseScrollProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const MouseScroll = React.forwardRef<SVGSVGElement, MouseScrollProps>(
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
      <rect x="3" y="3" width="10" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
      <rect x="7" y="6" width="2" height="5" rx="1" fill="currentColor" />
      <path d="M16 14H22L19 17L16 14Z" fill="#1976D2" />
      <path d="M16 10H22L19 7L16 10Z" fill="#1976D2" />
    </svg>
  )
);

MouseScroll.displayName = 'MouseScroll';

export default MouseScroll;
