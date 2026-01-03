// Auto-generated from action/replay.svg
import React from 'react';

export interface ReplayProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Replay = React.forwardRef<SVGSVGElement, ReplayProps>(({ size, ...props }, ref) => (
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
      d="M5.64938 5.64375C7.28063 4.0125 9.51939 3 12.0056 3C16.9781 3 20.9944 7.0275 20.9944 12C20.9944 16.9725 16.9781 21 12.0056 21C7.80939 21 4.31063 18.1313 3.30939 14.25H5.64938C6.57188 16.8713 9.06939 18.75 12.0056 18.75C15.7294 18.75 18.7556 15.7238 18.7556 12C18.7556 8.27625 15.7294 5.25 12.0056 5.25C10.1381 5.25 8.47313 6.02625 7.25813 7.2525L10.8806 10.875H3.00563V3L5.64938 5.64375Z"
      fill="currentColor"
    />
  </svg>
));

Replay.displayName = 'Replay';

export default Replay;
