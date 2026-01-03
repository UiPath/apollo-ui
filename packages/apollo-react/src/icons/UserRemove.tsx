// Auto-generated from social/user-remove.svg
import React from 'react';

export interface UserRemoveProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /**
   * Size to apply to both width and height.
   * @default 24
   */
  size?: string | number;
}

export const UserRemove = React.forwardRef<SVGSVGElement, UserRemoveProps>(
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
        d="M13.5 8C13.5 5.79 11.71 4 9.5 4C7.29 4 5.5 5.79 5.5 8C5.5 10.21 7.29 12 9.5 12C11.71 12 13.5 10.21 13.5 8ZM11.5 8C11.5 9.1 10.6 10 9.5 10C8.4 10 7.5 9.1 7.5 8C7.5 6.9 8.4 6 9.5 6C10.6 6 11.5 6.9 11.5 8Z"
        fill="currentColor"
      />
      <path
        d="M1.5 18V20H17.5V18C17.5 15.34 12.17 14 9.5 14C6.83 14 1.5 15.34 1.5 18ZM3.5 18C3.7 17.29 6.8 16 9.5 16C12.19 16 15.27 17.28 15.5 18H3.5Z"
        fill="currentColor"
      />
      <path d="M22.5 10H16.5V12H22.5V10Z" fill="currentColor" />
    </svg>
  )
);

UserRemove.displayName = 'UserRemove';

export default UserRemove;
