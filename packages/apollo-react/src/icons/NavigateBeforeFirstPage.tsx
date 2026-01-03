// Auto-generated from navigation/navigate-before-first-page.svg
import React from 'react';

export interface NavigateBeforeFirstPageProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const NavigateBeforeFirstPage = React.forwardRef<
  SVGSVGElement,
  NavigateBeforeFirstPageProps
>(({ size, ...props }, ref) => (
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
      d="M18.2049 16.59L13.6149 12L18.2049 7.41L16.7949 6L10.7949 12L16.7949 18L18.2049 16.59ZM5.79492 6H7.79492V18H5.79492V6Z"
      fill="currentColor"
    />
  </svg>
));

NavigateBeforeFirstPage.displayName = 'NavigateBeforeFirstPage';

export default NavigateBeforeFirstPage;
