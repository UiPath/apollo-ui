// Auto-generated from navigation/navigate-last-page.svg
import React from 'react';

export interface NavigateLastPageProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const NavigateLastPage = React.forwardRef<SVGSVGElement, NavigateLastPageProps>(
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
        d="M10.3849 12L5.79492 7.41L7.20492 6L13.2049 12L7.20492 18L5.79492 16.59L10.3849 12ZM18.2049 6H16.2049V18H18.2049V6Z"
        fill="currentColor"
      />
    </svg>
  )
);

NavigateLastPage.displayName = 'NavigateLastPage';

export default NavigateLastPage;
