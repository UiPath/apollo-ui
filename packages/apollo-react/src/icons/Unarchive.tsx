// Auto-generated from action/unarchive.svg
import React from 'react';

export interface UnarchiveProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const Unarchive = React.forwardRef<SVGSVGElement, UnarchiveProps>(
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
      <rect width="24" height="24" fill="var(--color-background)" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20 9.99998H4V20H20V9.99998ZM2 7.99998V22H22V7.99998H2Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 14V12H8V16H16V12H14V14H10Z"
        fill="currentColor"
      />
      <path
        d="M16.8994 4.94975L15.4852 6.36397L11.9497 2.82843L8.41413 6.36397L6.99992 4.94975L11.9497 5.42402e-06L16.8994 4.94975Z"
        fill="currentColor"
      />
      <rect x="9" y="8" width="6" height="2" fill="var(--color-background)" />
      <rect x="11" y="2" width="2" height="8" fill="currentColor" />
    </svg>
  )
);

Unarchive.displayName = 'Unarchive';

export default Unarchive;
