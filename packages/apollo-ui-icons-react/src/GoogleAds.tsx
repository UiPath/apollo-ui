// Auto-generated from third-party/google-ads.svg
import React from 'react';

export interface GoogleAdsProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const GoogleAds = React.forwardRef<SVGSVGElement, GoogleAdsProps>(
  ({ size, ...props }, ref) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ref={ref} {...props} width={size ?? 24} height={size ?? 24}>
      <path d="M0.534668 16.9791L8.53492 3.12222L15.4639 7.12269L7.46368 20.9795L0.534668 16.9791Z" fill="#FBBC04"/>
<path d="M23.464 16.9778L15.4631 3.12111C14.3585 1.20781 11.912 0.551861 9.99867 1.65647C8.08537 2.76108 7.42942 5.20759 8.53404 7.12089L16.535 20.9776C17.6396 22.8909 20.0861 23.5455 21.9994 22.4423C23.9127 21.3376 24.5673 18.8911 23.464 16.9778Z" fill="#4285F4"/>
<path d="M3.99978 22.9782C6.2088 22.9782 7.99957 21.1874 7.99957 18.9784C7.99957 16.7694 6.2088 14.9786 3.99978 14.9786C1.79076 14.9786 0 16.7694 0 18.9784C0 21.1874 1.79076 22.9782 3.99978 22.9782Z" fill="#34A853"/>
    </svg>
  )
);

GoogleAds.displayName = 'GoogleAds';

export default GoogleAds;
